// @ts-nocheck
import {
  OfficialSchool,
  OfficialUser,
  ProcessedSchoolData,
  CanvaOverviewData
} from '@/types/officialData';
import {
  loadFranchisingSchools,
  loadLicenseUsers,
  isEmailCompliant
} from '@/lib/safDataService';
import { School } from '@/types/safData';
import { getMaxLicensesPerSchool } from '@/config/licenseLimits';
import {



} from './index';

export { isEmailCompliant };

export const parseOfficialSchoolsCSV = async (): Promise<OfficialSchool[]> => {
  try {
    const schools = await loadFranchisingSchools();
    return schools.map((school) => ({
      id: school.id.toString(),
      name: school.nome || `Escola ${school.id}`,
      status: mapSchoolStatus(school.statusEscola),
      cluster: school.cluster || 'Outros',
      safManager: school.carteiraSaf || undefined,
      cnpj: school.cnpj || undefined,
      address: formatSchoolAddress(school),
      city: school.cidade || '',
      state: school.estado || '',
      region: school.regiao || '',
      phone: school.telefone || undefined,
      email: school.email || undefined,
    }));
  } catch (error) {
    console.error('Erro ao carregar escolas oficiais:', error);
    return [];
  }
};

export const parseOfficialUsersCSV = async (): Promise<OfficialUser[]> => {
  try {
    const users = await loadLicenseUsers();
    return users.map((user, index) => ({
      id: `lic-${user.email}-${index}`,
      name: user.nome || user.email.split('@')[0],
      email: user.email,
      role: mapUserRole(user.funcao),
      school: user.escolaNome || undefined,
      schoolId: user.escolaId !== null ? user.escolaId.toString() : undefined,
      licenseStatus: user.statusLicenca || undefined,
      updatedAt: user.atualizadoEm ? user.atualizadoEm.toISOString() : undefined,
      isCompliant: isEmailCompliant(user.email),
    }));
  } catch (error) {
    console.error('Erro ao carregar usuários oficiais:', error);
    return [];
  }
};

const formatSchoolAddress = (school: School): string => {
  const parts = [
    school.logradouro,
    school.bairro,
    school.cep,
    school.cidade,
    school.estado
  ]
    .map(part => part?.trim())
    .filter(Boolean);
  return parts.join(' • ');
};

const mapSchoolStatus = (status: string): 'Ativa' | 'Implantando' | 'Inativa' => {
  const statusLower = status?.toLowerCase() ?? '';
  if (statusLower.includes('ativa') || statusLower.includes('operando')) return 'Ativa';
  if (statusLower.includes('implant')) return 'Implantando';
  return 'Inativa';
};

const mapUserRole = (role: string): 'Estudante' | 'Professor' | 'Administrador' => {
  const roleLower = role?.toLowerCase() ?? '';
  if (roleLower.includes('professor')) return 'Professor';
  if (roleLower.includes('admin')) return 'Administrador';
  return 'Estudante';
};

export const processSchoolsWithUsers = async (): Promise<ProcessedSchoolData[]> => {
  const [schools, users] = await Promise.all([
    parseOfficialSchoolsCSV(),
    parseOfficialUsersCSV()
  ]);

  const schoolsMap = new Map(schools.map(s => [s.id, s]));
  const schoolsByName = new Map(schools.map(s => [s.name.toLowerCase(), s]));

  const usersBySchool = new Map<string, OfficialUser[]>();

  users.forEach(user => {
    let school: OfficialSchool | undefined;

    if (user.schoolId) {
      school = schoolsMap.get(user.schoolId);
    }

    if (!school && user.school) {
      const normalized = user.school.toLowerCase();
      school = schoolsByName.get(normalized);
      if (!school) {
        for (const [name, s] of schoolsByName) {
          if (name.includes(normalized) || normalized.includes(name)) {
            school = s;
            break;
          }
        }
      }
    }

    const schoolKey = school?.id || 'no-school';
    if (!usersBySchool.has(schoolKey)) {
      usersBySchool.set(schoolKey, []);
    }
    usersBySchool.get(schoolKey)!.push(user);
  });

  const processedData: ProcessedSchoolData[] = [];

  for (const school of schools) {
    const schoolUsers = usersBySchool.get(school.id) || [];
    const compliantUsers = schoolUsers.filter(u => u.isCompliant).length;
    const nonCompliantUsers = schoolUsers.length - compliantUsers;

    const estimatedLicenses = estimateSchoolLicenses(school, schoolUsers.length);
    const licenseStatus = calculateLicenseStatusUtil(schoolUsers.length, estimatedLicenses);

    processedData.push({
      school,
      users: schoolUsers,
      totalUsers: schoolUsers.length,
      compliantUsers,
      nonCompliantUsers,
      estimatedLicenses,
      licenseStatus,
    });
  }

  const usersWithoutSchool = usersBySchool.get('no-school') || [];
  if (usersWithoutSchool.length > 0) {
    const compliantUsers = usersWithoutSchool.filter(u => u.isCompliant).length;

    processedData.push({
      school: {
        id: 'no-school',
        name: 'Usuários Sem Escola Definida',
        status: 'Inativa',
        cluster: 'Outros',
      },
      users: usersWithoutSchool,
      totalUsers: usersWithoutSchool.length,
      compliantUsers,
      nonCompliantUsers: usersWithoutSchool.length - compliantUsers,
      estimatedLicenses: 0,
      licenseStatus: 'Excedido',
    });
  }

  return processedData.sort((a, b) => b.totalUsers - a.totalUsers);
};

const estimateSchoolLicenses = (school: OfficialSchool, userCount: number): number => {
  return school.id === 'no-school'
    ? Math.max(userCount, 1)
    : getMaxLicensesPerSchool();
};

export const generateCanvaOverview = async (): Promise<CanvaOverviewData> => {
  const users = await parseOfficialUsersCSV();
  const schools = await parseOfficialSchoolsCSV();

  const compliantUsers = users.filter(u => u.isCompliant).length;
  const nonCompliantUsers = users.length - compliantUsers;

  const nonMapleBearDomains = new Map<string, number>();
  users.forEach(user => {
    if (!user.isCompliant) {
      const domain = user.email.split('@')[1]?.toLowerCase();
      if (domain) {
        nonMapleBearDomains.set(domain, (nonMapleBearDomains.get(domain) || 0) + 1);
      }
    }
  });

  const topNonCompliantDomains = Array.from(nonMapleBearDomains.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const schoolsWithUsers = new Set(users.filter(u => u.school).map(u => u.school)).size;
  const activeSchools = schools.filter(s => s.status === 'Ativa').length;

  return {
    totalUsers: users.length,
    totalSchools: schools.length,
    compliantUsers,
    nonCompliantUsers,
    complianceRate: (compliantUsers / users.length) * 100,
    nonMapleBearDomains: nonCompliantUsers,
    topNonCompliantDomains,
    schoolsWithUsers,
    schoolsAtCapacity: Math.floor(activeSchools * 0.6),
  };
};

// Esta função foi movida da store para isolar a lógica de processamento de dados.

/**
 * Normaliza um valor para string, tratando null/undefined como string vazia.
 * @param value - O valor a ser normalizado.
 * @returns O valor como string.
 */
const normalizeValue = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

/**
 * Mapeia o perfil do usuário para um valor padrão.
 * @param role - Perfil do usuário.
 * @returns Perfil do usuário mapeado.
 */
const mapUserRoleFallback = (role: string): UserRole => {
  switch (role) {
    case 'Estudante':
      return 'Estudante';
    case 'Professor':
      return 'Professor';
    case 'Administrador':
      return 'Administrador';
    default:
      return 'Estudante'; // Assumindo Estudante como fallback
  }
};

/**
 * Mapeia o status da escola para um valor padrão.
 * @param status - Status da escola.
 * @returns Status da escola mapeado.
 */
const mapSchoolStatusFallback = (status: string): SchoolStatus => {
  switch (status) {
    case 'Ativa':
      return 'Ativa';
    case 'Inativa':
      return 'Inativa';
    case 'Implantação':
      return 'Implantação';
    default:
      return 'Outros';
  }
};

/**
 * Calcula o status da licença com base no uso e no total de licenças.
 * @param usedLicenses - Número de licenças em uso.
 * @param totalLicenses - Número total de licenças disponíveis.
 * @returns Status da licença ('Disponível', 'Completo', 'Excedido').
 */
const calculateLicenseStatusUtil = (usedLicenses: number, totalLicenses: number): 'Disponível' | 'Completo' | 'Excedido' => {
  if (usedLicenses > totalLicenses) {
    return 'Excedido';
  }
  if (usedLicenses === totalLicenses) {
    return 'Completo';
  }
  return 'Disponível';
};
export const buildFallbackData = async (): Promise<{
  processedData: ProcessedSchoolData[];
  overview: CanvaOverviewData;
} | null> => {
  const [schools, licenseUsers] = await Promise.all([
    loadFranchisingSchools(),
    loadLicenseUsers()
  ]);

  if (!licenseUsers.length) {
    return null;
  }

  const schoolById = new Map<number, typeof schools[number]>();
  const schoolByName = new Map<string, typeof schools[number]>();
  schools.forEach((school) => {
    schoolById.set(school.id, school);
    schoolByName.set(normalizeValue(school.nome), school);
  });

  const toOfficialSchool = (school: typeof schools[number]): OfficialSchool => ({
    id: school.id.toString(),
    name: school.nome || `Escola ${school.id}`,
    status: mapSchoolStatusFallback(school.statusEscola),
    cluster: school.cluster || 'Outros',
    safManager: school.carteiraSaf || undefined,
    cnpj: school.cnpj || undefined,
    city: school.cidade || '',
    state: school.estado || '',
    region: school.regiao || '',
    address: school.logradouro || ''
  });

  const findSchool = (userSchoolId: number | null, userSchoolName: string | null) => {
    if (userSchoolId !== null) {
      const byId = schoolById.get(userSchoolId);
      if (byId) return byId;
    }
    if (userSchoolName) {
      const normalized = normalizeValue(userSchoolName);
      const exact = schoolByName.get(normalized);
      if (exact) return exact;
      for (const [key, school] of schoolByName.entries()) {
        if (key.includes(normalized) || normalized.includes(key)) {
          return school;
        }
      }
    }
    return null;
  };

  const officialSchools = new Map<string, OfficialSchool>();
  const usersBySchool = new Map<string, OfficialUser[]>();

  // Inclui todas as escolas mesmo antes de processar licen\u00e7as para mant\u00ea-las vis\u00edveis.
  schools.forEach((school) => {
    const key = school.id.toString();
    officialSchools.set(key, toOfficialSchool(school));
    usersBySchool.set(key, []);
  });

  licenseUsers.forEach((user, idx) => {
    const matchedSchool = findSchool(user.escolaId, user.escolaNome);
    if (matchedSchool) {
      const key = matchedSchool.id.toString();
      if (!officialSchools.has(key)) {
        officialSchools.set(key, toOfficialSchool(matchedSchool));
      }
    }

    const schoolKey = matchedSchool ? matchedSchool.id.toString() : 'no-school';
    const officialUser: OfficialUser = {
      id: `fallback-${idx}-${user.email}`,
      name: user.nome || user.email.split('@')[0],
      email: user.email,
      role: mapUserRoleFallback(user.funcao),
      school: matchedSchool?.nome,
      schoolId: matchedSchool ? matchedSchool.id.toString() : undefined,
      licenseStatus: user.statusLicenca || undefined,
      updatedAt: user.atualizadoEm ? user.atualizadoEm.toISOString() : undefined,
      isCompliant: isEmailCompliant(user.email),
    };

    const bucket = usersBySchool.get(schoolKey) ?? [];
    bucket.push(officialUser);
    usersBySchool.set(schoolKey, bucket);
  });

  const processedData: ProcessedSchoolData[] = [];
  officialSchools.forEach((officialSchool, schoolId) => {
    const bucket = usersBySchool.get(schoolId) ?? [];
    const totalUsers = bucket.length;
    const estimatedLicenses = getMaxLicensesPerSchool();

    processedData.push({
      school: officialSchool,
      users: bucket,
      totalUsers,
      compliantUsers: bucket.filter((user) => user.isCompliant).length,
      nonCompliantUsers: bucket.filter((user) => !user.isCompliant).length,
      estimatedLicenses,
      licenseStatus: calculateLicenseStatusUtil(totalUsers, estimatedLicenses)
    });
  });

  const usersWithoutSchool = usersBySchool.get('no-school') || [];
  if (usersWithoutSchool.length > 0) {
    const compliantUsers = usersWithoutSchool.filter((u) => u.isCompliant).length;

    processedData.push({
      school: {
        id: 'no-school',
        name: 'Usuários sem escola',
        status: 'Ativa',
        cluster: 'Outros',
        city: '',
        state: '',
        region: ''
      } as OfficialSchool,
      users: usersWithoutSchool,
      totalUsers: usersWithoutSchool.length,
      compliantUsers,
      nonCompliantUsers: usersWithoutSchool.length - compliantUsers,
      estimatedLicenses: Math.max(usersWithoutSchool.length, 1),
      licenseStatus: calculateLicenseStatusUtil(
        usersWithoutSchool.length,
        Math.max(usersWithoutSchool.length, 1)
      )
    });
  }

  const compliantUsers = licenseUsers.filter((u) => isEmailCompliant(u.email)).length;
  const nonCompliantUsers = licenseUsers.length - compliantUsers;

  const nonMapleBearDomains = new Map<string, number>();
  licenseUsers.forEach((user) => {
    if (!isEmailCompliant(user.email)) {
      const domain = user.email.split('@')[1]?.toLowerCase();
      if (domain) {
        nonMapleBearDomains.set(domain, (nonMapleBearDomains.get(domain) || 0) + 1);
      }
    }
  });

  const topNonCompliantDomains = Array.from(nonMapleBearDomains.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const schoolsWithUsers = Array.from(usersBySchool.entries()).filter(
    ([key, bucket]) => key !== 'no-school' && bucket.length > 0
  ).length;

  const overview: CanvaOverviewData = {
    totalUsers: licenseUsers.length,
    totalSchools: schools.length,
    compliantUsers,
    nonCompliantUsers,
    complianceRate: licenseUsers.length ? (compliantUsers / licenseUsers.length) * 100 : 0,
    nonMapleBearDomains: nonCompliantUsers,
    topNonCompliantDomains,
    schoolsWithUsers,
    schoolsAtCapacity: Math.floor((schools.length || 0) * 0.6),
    totalLicenses: schools.length * getMaxLicensesPerSchool(),
    usedLicenses: licenseUsers.length,
    availableLicenses: Math.max(schools.length * getMaxLicensesPerSchool() - licenseUsers.length, 0),
  };

  return { processedData, overview };
};

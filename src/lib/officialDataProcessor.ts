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
import { MAX_LICENSES_PER_SCHOOL } from '@/config/licenseLimits';

export { isEmailCompliant };
import { School } from '@/types/safData';

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
    const licenseStatus = calculateLicenseStatus(schoolUsers.length, estimatedLicenses);

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
    : MAX_LICENSES_PER_SCHOOL;
};

const calculateLicenseStatus = (usedLicenses: number, totalLicenses: number): 'Disponível' | 'Completo' | 'Excedido' => {
  if (usedLicenses > totalLicenses) return 'Excedido';
  if (usedLicenses === totalLicenses) return 'Completo';
  return 'Disponível';
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

import { MAX_LICENSES_PER_SCHOOL } from '@/config/licenseLimits';
import { loadFranchisingSchools, loadLicenseUsers, isEmailCompliant } from '@/lib/safDataService';
import type {
  School as BackendSchoolRecord,
  LicenseUser as BackendLicenseUser
} from '@/types/safData';

export interface School {
  id: string;
  name: string;
  status: 'Ativa' | 'Implantando' | 'Inativa';
  cluster: string;
  city: string;
  state: string;
  region: string;
  email: string;
  phone: string;
  cnpj: string;
  maxLicenses: number;
  usedLicenses: number;
  users: SchoolUser[];
}

export interface SchoolUser {
  name: string;
  email: string;
  role: string;
  school: string;
  schoolId: string;
  licenseStatus: string;
  updatedAt: string;
}

export interface LicenseStatus {
  available: number;
  used: number;
  total: number;
  percentage: number;
  status: 'available' | 'warning' | 'full' | 'excess';
}

const normalizeStatusLabel = (status: string): 'Ativa' | 'Implantando' | 'Inativa' => {
  const normalized = status?.trim().toLowerCase() ?? '';
  if (normalized.includes('ativa') || normalized.includes('operando')) return 'Ativa';
  if (normalized.includes('implant')) return 'Implantando';
  return 'Inativa';
};

const buildProcessorSchool = (raw: BackendSchoolRecord): School => ({
  id: raw.id.toString(),
  name: raw.nome,
  status: normalizeStatusLabel(raw.statusEscola),
  cluster: raw.cluster,
  city: raw.cidade,
  state: raw.estado,
  region: raw.regiao,
  email: raw.email ?? '',
  phone: raw.telefone ?? '',
  cnpj: raw.cnpj ?? '',
  maxLicenses: MAX_LICENSES_PER_SCHOOL,
  usedLicenses: 0,
  users: []
});

const buildProcessorUser = (user: BackendLicenseUser): SchoolUser => ({
  name: user.nome,
  email: user.email,
  role: user.funcao,
  school: user.escolaNome ?? '',
  schoolId: user.escolaId !== null ? String(user.escolaId) : '',
  licenseStatus: user.statusLicenca ?? '',
  updatedAt: user.atualizadoEm
    ? user.atualizadoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : ''
});

export function calculateLicenseStatus(school: School): LicenseStatus {
  const used = school.usedLicenses;
  const total = school.maxLicenses;
  const available = Math.max(0, total - used);
  const percentage = total > 0 ? (used / total) * 100 : 0;
  
  let status: 'available' | 'warning' | 'full' | 'excess';
  
  if (used > total) {
    status = 'excess';
  } else if (used === total) {
    status = 'full';
  } else if (percentage >= 80) {
    status = 'warning';
  } else {
    status = 'available';
  }
  
  return {
    available,
    used,
    total,
    percentage,
    status
  };
}

export function combineSchoolsAndUsers(schools: School[], users: SchoolUser[]): School[] {
  const normalizeName = (value: string): string => value?.trim().toLowerCase() ?? '';
  const schoolMap = new Map<string, School>();
  schools.forEach(school => {
    schoolMap.set(normalizeName(school.name), school);
  });
  
  const usersBySchool = new Map<string, SchoolUser[]>();
  users.forEach(user => {
    const key = normalizeName(user.school);
    if (!key) return;
    if (!usersBySchool.has(key)) {
      usersBySchool.set(key, []);
    }
    usersBySchool.get(key)!.push(user);
  });
  
  return schools.map(school => {
    const key = normalizeName(school.name);
    const schoolUsers = usersBySchool.get(key) || [];
    const activeUsers = schoolUsers.filter(user => {
      const licenseStatus = user.licenseStatus.toLowerCase();
      return (
        licenseStatus.includes('ativa') ||
        licenseStatus.includes('ativo') ||
        isEmailCompliant(user.email)
      );
    });
    
    return {
      ...school,
      users: schoolUsers,
      usedLicenses: Math.min(activeUsers.length, school.maxLicenses + 5)
    };
  });
}

export function getSchoolStats(schools: School[]) {
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'Ativa').length;
  const totalUsers = schools.reduce((sum, school) => sum + school.users.length, 0);
  const totalLicenses = schools.reduce((sum, school) => sum + school.maxLicenses, 0);
  const usedLicenses = schools.reduce((sum, school) => sum + school.usedLicenses, 0);
  const availableLicenses = totalLicenses - usedLicenses;
  
  const schoolsWithExcess = schools.filter(school => {
    const status = calculateLicenseStatus(school);
    return status.status === 'excess';
  }).length;
  
  const utilizationRate = totalLicenses > 0 ? (usedLicenses / totalLicenses) * 100 : 0;
  
  return {
    totalSchools,
    activeSchools,
    totalUsers,
    totalLicenses,
    usedLicenses,
    availableLicenses,
    schoolsWithExcess,
    utilizationRate
  };
}

export async function loadSchoolData(): Promise<School[]> {
  try {
    const [rawSchools, rawUsers] = await Promise.all([
      loadFranchisingSchools(),
      loadLicenseUsers()
    ]);
    
    const schools = rawSchools.map(buildProcessorSchool);
    const users = rawUsers.map(buildProcessorUser);
    
    return combineSchoolsAndUsers(schools, users);
  } catch (error) {
    console.error('Erro ao carregar dados das escolas:', error);
    throw new Error('Falha ao carregar dados das escolas. Veja o console para detalhes.');
  }
}

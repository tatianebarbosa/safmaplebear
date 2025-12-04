// @ts-nocheck
import { CanvaOverviewData, OfficialSchool, OfficialUser, ProcessedSchoolData } from '@/types/officialData';
import { isEmailCompliant } from '@/lib/safDataService';
import { getMaxLicensesPerSchool } from '@/config/licenseLimits';

export interface IntegratedCanvaUser {
  nome?: string;
  email?: string;
  funcao?: string;
}

export interface IntegratedSchoolAllocation {
  school_id: number;
  school_name?: string;
  users?: IntegratedCanvaUser[];
  total_users: number;
  total_licenses?: number;
}

export interface IntegratedCanvaData {
  timestamp?: number;
  data_atualizacao?: string;
  hora_atualizacao?: string;
  periodo_filtro?: string;
  coleta_manual?: boolean;
  timestamp_coleta?: string;
  canva_metrics?: Record<string, number>;
  schools_allocation?: IntegratedSchoolAllocation[];
  unallocated_users_list?: IntegratedCanvaUser[];
  unallocated_users_count?: number;
  modelos?: Array<Record<string, any>>;
}

const INTEGRATED_SOURCES = [
  '/api/canva/dados-recentes',
  '/canva_data_integrated_latest.json',
  '/data/canva_data_integrated_latest.json'
];

const DOMAIN_SCHOOL_OVERRIDES: Record<string, { id: string; name: string }> = {
  'mbguarulhos.com.br': { id: '90', name: 'Maple Bear Guarulhos - Centro' }
};

const fetchWithTimeout = async (input: RequestInfo | URL, init?: RequestInit & { timeout?: number }) => {
  const controller = new AbortController();
  const timeout = init?.timeout ?? 4000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const normalizeRole = (role?: string): OfficialUser['role'] => {
  const normalized = (role ?? '').toLowerCase();
  if (normalized.includes('professor')) return 'Professor';
  if (
    normalized.includes('admin') ||
    normalized.includes('administrador') ||
    normalized.includes('titular') ||
    normalized.includes('coordenador')
  ) {
    return 'Administrador';
  }
  return 'Estudante';
};

const buildOfficialUser = (
  user: IntegratedCanvaUser,
  schoolName: string | undefined,
  schoolId?: number
): OfficialUser | null => {
  const email = (user.email ?? '').trim().toLowerCase();
  if (!email || !email.includes('@')) return null;
  const nameCandidate = user.nome?.trim() || '';
  const name = nameCandidate || email.split('@')[0] || 'Usuário';

  return {
    id: `${schoolId ?? 0}-${email}`,
    name,
    email,
    role: normalizeRole(user.funcao),
    school: schoolName,
    schoolId: schoolId != null ? schoolId.toString() : undefined,
    licenseStatus: undefined,
    updatedAt: undefined,
    isCompliant: isEmailCompliant(email),
  };
};

const deriveLicenseStatus = (used: number, total: number): 'Disponvel' | 'Completo' | 'Excedido' => {
  if (total === 0) return 'Disponvel';
  if (used > total) return 'Excedido';
  if (used === total) return 'Completo';
  return 'Disponvel';
};

export async function fetchIntegratedCanvaData(): Promise<IntegratedCanvaData | null> {
  for (const source of INTEGRATED_SOURCES) {
    try {
      const response = await fetchWithTimeout(source, { cache: 'no-store', timeout: 4000 });
      if (!response.ok) {
        continue;
      }
      const contentType = response.headers.get('content-type') ?? '';
      const rawText = await response.text();
      if (!contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(rawText) as IntegratedCanvaData;
          if (parsed && (parsed.schools_allocation || parsed.unallocated_users_list)) {
            return parsed;
          }
        } catch {
          console.warn(`[integratedCanvaService] Contedo invlido em ${source}`);
          continue;
        }
      } else {
        try {
          const payload = JSON.parse(rawText) as IntegratedCanvaData;
          if (payload && (payload.schools_allocation || payload.unallocated_users_list)) {
            return payload;
          }
        } catch (error) {
          console.warn(`[integratedCanvaService] Falha ao parsear JSON de ${source}`, error);
          continue;
        }
      }
    } catch (error) {
      const reason = error instanceof Error && error.name === 'AbortError'
        ? 'timeout excedido'
        : (error as Error)?.message || 'erro desconhecido';
      console.warn(`[integratedCanvaService] Falha ao carregar ${source} (${reason})`);
    }
  }
  return null;
}

export function buildProcessedSchoolsFromIntegration(
  data: IntegratedCanvaData,
  officialSchools: OfficialSchool[]
): ProcessedSchoolData[] {
  const officialSchoolMap = new Map(officialSchools.map((school) => [school.id, school]));
  const allocationMap = new Map<string, IntegratedSchoolAllocation>();
  (data.schools_allocation ?? []).forEach((allocation) => {
    const key = (allocation.school_id ?? 0).toString();
    allocationMap.set(key, {
      ...allocation,
      users: allocation.users ? [...allocation.users] : []
    });
  });

  Object.values(DOMAIN_SCHOOL_OVERRIDES).forEach((override) => {
    if (!allocationMap.has(override.id)) {
      allocationMap.set(override.id, {
        school_id: Number(override.id),
        school_name: override.name,
        users: [],
        total_users: 0,
        total_licenses: 0
      });
    }
  });

  allocationMap.forEach((allocation, key) => {
    const remainingUsers: IntegratedCanvaUser[] = [];
    (allocation.users ?? []).forEach((user) => {
      const domain = user.email?.split('@')[1]?.toLowerCase();
      const override = domain ? DOMAIN_SCHOOL_OVERRIDES[domain] : undefined;
      if (override && key !== override.id) {
        const target = allocationMap.get(override.id);
        if (target) {
          (target.users ?? (target.users = [])).push(user);
        }
      } else {
        remainingUsers.push(user);
      }
    });
    allocation.users = remainingUsers;
    allocation.total_users = remainingUsers.length;
  });

  let allocations = Array.from(allocationMap.values());

  if (!allocations.some((allocation) => allocation.school_id === 0) && data.unallocated_users_list?.length) {
    allocations.push({
      school_id: 0,
      school_name: 'Usuários Sem Escola Definida',
      users: data.unallocated_users_list,
      total_users: data.unallocated_users_list.length,
      total_licenses: data.unallocated_users_list.length,
    });
  }

  const result: ProcessedSchoolData[] = allocations.map((allocation) => {
    const allocationSchoolId = allocation.school_id || 0;
    const schoolIdKey = allocationSchoolId.toString();
    const officialSchool = officialSchoolMap.get(schoolIdKey);
    const schoolRecord: OfficialSchool = officialSchool ?? {
      id: schoolIdKey,
      name: allocation.school_name || `Escola ${schoolIdKey}`,
      status: 'Ativa',
      cluster: officialSchool?.cluster || 'Outros',
    };

    const users = (allocation.users ?? [])
      .map((user) => buildOfficialUser(user, schoolRecord.name, allocationSchoolId))
      .filter((user): user is OfficialUser => user !== null);

    const compliantUsers = users.filter((user) => user.isCompliant).length;
    const totalUsers = users.length;
    const nonCompliantUsers = totalUsers - compliantUsers;
    const licenseTotal =
      schoolRecord.id === '0'
        ? Math.max(totalUsers, 1)
        : getMaxLicensesPerSchool();

    return {
      school: schoolRecord,
      users,
      totalUsers,
      compliantUsers,
      nonCompliantUsers,
      estimatedLicenses: licenseTotal,
      licenseStatus: deriveLicenseStatus(totalUsers, licenseTotal),
    };
  });

  return result.sort((a, b) => b.totalUsers - a.totalUsers);
}

export function buildOverviewFromIntegration(
  data: IntegratedCanvaData,
  officialSchools: OfficialSchool[],
  processedSchools: ProcessedSchoolData[]
): CanvaOverviewData {
  const allUsers = processedSchools.flatMap((school) => school.users);
  const nonCompliantUsers = allUsers.filter((user) => !user.isCompliant);
  const domainCounts = nonCompliantUsers.reduce<Record<string, number>>((acc, user) => {
    const domain = user.email.split('@')[1]?.toLowerCase();
    if (!domain) return acc;
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  const topNonCompliantDomains = Object.entries(domainCounts)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalUsers = allUsers.length;
  const compliantUsers = totalUsers - nonCompliantUsers.length;
  const complianceRate = totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : 100;
  const activeSchools = officialSchools.filter((school) => school.status === 'Ativa').length;
  const totalLicenses = processedSchools.reduce(
    (acc, school) => acc + (school.estimatedLicenses ?? 0),
    0
  );
  const availableLicenses = Math.max(totalLicenses - totalUsers, 0);

  return {
    totalUsers,
    totalSchools: officialSchools.length,
    compliantUsers,
    nonCompliantUsers: nonCompliantUsers.length,
    complianceRate,
    nonMapleBearDomains: nonCompliantUsers.length,
    topNonCompliantDomains,
    schoolsWithUsers: processedSchools.filter((school) => school.totalUsers > 0 && school.school.id !== '0').length,
    schoolsAtCapacity: Math.floor(activeSchools * 0.6),
    totalLicenses,
    usedLicenses: totalUsers,
    availableLicenses,
  };
}

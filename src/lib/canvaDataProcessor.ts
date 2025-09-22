export interface CanvaUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActivity: string;
  designsCreated: number;
  designsPublished: number;
  sharedLinks: number;
  designsViewed: number;
  school?: string;
  schoolId?: string;
  isCompliant: boolean; // Se está dentro da política de domínio
  complianceIssue?: string;
  period: '30d' | '3m' | '6m' | '12m';
}

export interface SchoolCanvaData {
  schoolId: string;
  schoolName: string;
  cluster?: string;
  maxLicenses: number;
  usedLicenses: number;
  availableLicenses: number;
  users: CanvaUser[];
  nonCompliantUsers: CanvaUser[];
  totalActivity: {
    designsCreated: number;
    designsPublished: number;
    sharedLinks: number;
    designsViewed: number;
  };
  performance: 'high' | 'medium' | 'low';
  utilizationRate: number;
  hasLicenseIssues: boolean;
  licenseStatus: 'normal' | 'over_limit' | 'needs_attention';
}

export interface CanvaAnalytics {
  totalUsers: number;
  compliantUsers: number;
  nonCompliantUsers: number;
  totalSchools: number;
  schoolsAtCapacity: number;
  schoolsUnderUtilized: number;
  topPerformingSchools: SchoolCanvaData[];
  complianceRate: number;
  totalActivity: {
    designsCreated: number;
    designsPublished: number;
    sharedLinks: number;
    designsViewed: number;
  };
  periodComparison: {
    period: string;
    users: number;
    activity: number;
    growth: number;
  }[];
}

export interface UserRanking {
  user: CanvaUser;
  rank: number;
  score: number;
  category: 'most_active' | 'most_creative' | 'most_shared' | 'most_viewed';
}

// Allowed domains for compliance check
const ALLOWED_DOMAINS = [
  'maplebear.com.br',
  'seb.com.br', 
  'sebsa.com.br'
];

interface LicenseAction {
  id: string;
  schoolId: string;
  schoolName: string;
  action: 'add' | 'remove' | 'transfer' | 'delete';
  userId?: string;
  userName?: string;
  userEmail?: string;
  targetSchoolId?: string;
  targetSchoolName?: string;
  justification: string;
  timestamp: string;
  performedBy: string;
}

// Domínios permitidos pela política
const COMPLIANT_DOMAINS = ['maplebear.com.br', 'sebsa.com.br', 'seb.com.br'];

const isEmailCompliant = (email: string): boolean => {
  return COMPLIANT_DOMAINS.some(domain => email.toLowerCase().includes(domain));
};

const parseCanvaReportCSV = (csvContent: string, period: '30d' | '3m' | '6m' | '12m'): CanvaUser[] => {
  const lines = csvContent.split('\n');
  const users: CanvaUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV considerando aspas
    const matches = line.match(/(?:"([^"]*)"|([^",]+))/g);
    if (!matches || matches.length < 8) continue;

    const cleanValue = (value: string) => value.replace(/^"|"$/g, '');
    
    const name = cleanValue(matches[0]);
    const email = cleanValue(matches[1]);
    const role = cleanValue(matches[2]);
    const lastActivity = cleanValue(matches[3]);
    const designsCreated = parseInt(cleanValue(matches[4])) || 0;
    const designsPublished = parseInt(cleanValue(matches[5])) || 0;
    const sharedLinks = parseInt(cleanValue(matches[6])) || 0;
    const designsViewed = parseInt(cleanValue(matches[7])) || 0;

    if (!name || !email) continue;

    const isCompliant = isEmailCompliant(email);
    const complianceIssue = !isCompliant ? 'Domínio fora da política corporativa' : undefined;

    users.push({
      id: `${email}-${period}`,
      name,
      email,
      role,
      lastActivity,
      designsCreated,
      designsPublished,
      sharedLinks,
      designsViewed,
      isCompliant,
      complianceIssue,
      period
    });
  }

  return users;
};

const parseUsersCSV = (csvContent: string): { [email: string]: { school: string; schoolId: string; cluster?: string } } => {
  const lines = csvContent.split('\n');
  const userSchoolMap: { [email: string]: { school: string; schoolId: string; cluster?: string } } = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(';');
    if (columns.length < 5) continue;

    const email = columns[1]?.trim();
    const school = columns[3]?.trim();
    const schoolId = columns[4]?.trim();

    if (email && email.includes('@')) { // Ensure valid email
      const cluster = extractClusterFromSchool(school);
      userSchoolMap[email] = { 
        school: school || 'A definir escola em breve', 
        schoolId: schoolId || 'unknown',
        cluster
      };
    }
  }

  return userSchoolMap;
};

const extractClusterFromSchool = (schoolName: string): string => {
  if (!schoolName) return 'Indefinido';
  
  // Extract cluster from school name patterns
  if (schoolName.includes('São Paulo') || schoolName.includes('SP')) return 'São Paulo';
  if (schoolName.includes('Rio de Janeiro') || schoolName.includes('RJ')) return 'Rio de Janeiro';
  if (schoolName.includes('Belo Horizonte') || schoolName.includes('BH')) return 'Minas Gerais';
  if (schoolName.includes('Salvador') || schoolName.includes('Bahia')) return 'Bahia';
  if (schoolName.includes('Recife') || schoolName.includes('Caruaru')) return 'Pernambuco';
  if (schoolName.includes('Brasília') || schoolName.includes('DF')) return 'Distrito Federal';
  if (schoolName.includes('Porto Alegre') || schoolName.includes('RS')) return 'Rio Grande do Sul';
  if (schoolName.includes('Curitiba') || schoolName.includes('PR')) return 'Paraná';
  if (schoolName.includes('Fortaleza') || schoolName.includes('CE')) return 'Ceará';
  if (schoolName.includes('Goiânia') || schoolName.includes('GO')) return 'Goiás';
  
  return 'Outros Estados';
};

export const loadCanvaData = async (period: '30d' | '3m' | '6m' | '12m' = '30d'): Promise<CanvaUser[]> => {
  try {
    // Load users mapping from CSV (updated file)
    const usersResponse = await fetch('/data/usuarios_canva_atualizados.csv');
    const usersText = await usersResponse.text();
    const usersMapping = parseUsersCSV(usersText);

    // Load Canva activity data
    const canvaResponse = await fetch(`/data/relatorio_canva_${period === '30d' ? '30_dias' : period === '3m' ? '3_meses' : period === '6m' ? '6_meses' : '12_meses'}.csv`);
    const canvaText = await canvaResponse.text();
    
    const canvaUsers = parseCanvaReportCSV(canvaText, period);
    
    // Enrich with school information
    const enrichedUsers = canvaUsers.map(user => ({
      ...user,
      school: usersMapping[user.email]?.school || 'A definir escola em breve',
      schoolId: usersMapping[user.email]?.schoolId || 'unknown'
    }));

    console.log(`Loaded ${enrichedUsers.length} Canva users for period ${period}`);
    return enrichedUsers;
  } catch (error) {
    console.error('Error loading Canva data:', error);
    throw new Error('Failed to load Canva data');
  }
};

export const generateSchoolCanvaData = (users: CanvaUser[]): SchoolCanvaData[] => {
  const schoolMap = new Map<string, CanvaUser[]>();

  // Agrupar usuários por escola
  users.forEach(user => {
    const schoolKey = user.schoolId || 'unassigned';
    if (!schoolMap.has(schoolKey)) {
      schoolMap.set(schoolKey, []);
    }
    schoolMap.get(schoolKey)!.push(user);
  });

  const schoolsData: SchoolCanvaData[] = [];

  schoolMap.forEach((schoolUsers, schoolId) => {
    const schoolName = schoolUsers[0]?.school || 'Escola não definida';
    const cluster = extractClusterFromSchool(schoolName);
    const nonCompliantUsers = schoolUsers.filter(u => !u.isCompliant);
    
    const totalActivity = schoolUsers.reduce((acc, user) => ({
      designsCreated: acc.designsCreated + user.designsCreated,
      designsPublished: acc.designsPublished + user.designsPublished,
      sharedLinks: acc.sharedLinks + user.sharedLinks,
      designsViewed: acc.designsViewed + user.designsViewed
    }), { designsCreated: 0, designsPublished: 0, sharedLinks: 0, designsViewed: 0 });

    const utilizationRate = Math.min((schoolUsers.length / 2) * 100, 100); // 2 licenças por escola
    
    let performance: 'high' | 'medium' | 'low' = 'low';
    const avgActivity = (totalActivity.designsCreated + totalActivity.designsPublished) / schoolUsers.length;
    if (avgActivity > 100) performance = 'high';
    else if (avgActivity > 50) performance = 'medium';

    const hasLicenseIssues = schoolUsers.length > 2 || nonCompliantUsers.length > 0;
    const licenseStatus: 'normal' | 'over_limit' | 'needs_attention' = 
      schoolUsers.length > 2 ? 'over_limit' : 
      nonCompliantUsers.length > 0 ? 'needs_attention' : 'normal';

    schoolsData.push({
      schoolId,
      schoolName,
      cluster,
      maxLicenses: 2,
      usedLicenses: schoolUsers.length,
      availableLicenses: Math.max(0, 2 - schoolUsers.length),
      users: schoolUsers,
      nonCompliantUsers,
      totalActivity,
      performance,
      utilizationRate,
      hasLicenseIssues,
      licenseStatus
    });
  });

  return schoolsData.sort((a, b) => b.totalActivity.designsCreated - a.totalActivity.designsCreated);
};

export const generateCanvaAnalytics = (users: CanvaUser[]): CanvaAnalytics => {
  const compliantUsers = users.filter(u => u.isCompliant);
  const nonCompliantUsers = users.filter(u => !u.isCompliant);
  const schoolsData = generateSchoolCanvaData(users);
  
  const totalActivity = users.reduce((acc, user) => ({
    designsCreated: acc.designsCreated + user.designsCreated,
    designsPublished: acc.designsPublished + user.designsPublished,
    sharedLinks: acc.sharedLinks + user.sharedLinks,
    designsViewed: acc.designsViewed + user.designsViewed
  }), { designsCreated: 0, designsPublished: 0, sharedLinks: 0, designsViewed: 0 });

  const schoolsAtCapacity = schoolsData.filter(s => s.usedLicenses >= s.maxLicenses).length;
  const schoolsUnderUtilized = schoolsData.filter(s => s.usedLicenses < s.maxLicenses).length;
  const topPerformingSchools = schoolsData.slice(0, 10);

  const complianceRate = users.length > 0 ? (compliantUsers.length / users.length) * 100 : 0;

  return {
    totalUsers: users.length,
    compliantUsers: compliantUsers.length,
    nonCompliantUsers: nonCompliantUsers.length,
    totalSchools: schoolsData.length,
    schoolsAtCapacity,
    schoolsUnderUtilized,
    topPerformingSchools,
    complianceRate,
    totalActivity,
    periodComparison: [] // Implementar comparação de períodos
  };
};

export const generateUserRankings = (users: CanvaUser[]): {
  mostActive: UserRanking[];
  mostCreative: UserRanking[];
  mostShared: UserRanking[];
  mostViewed: UserRanking[];
} => {
  const calculateActivityScore = (user: CanvaUser) => 
    user.designsCreated + user.designsPublished + user.sharedLinks + (user.designsViewed * 0.1);

  const createRanking = (users: CanvaUser[], scoreKey: keyof CanvaUser, category: UserRanking['category']): UserRanking[] => {
    return users
      .sort((a, b) => Number(b[scoreKey]) - Number(a[scoreKey]))
      .slice(0, 20)
      .map((user, index) => ({
        user,
        rank: index + 1,
        score: Number(user[scoreKey]),
        category
      }));
  };

  return {
    mostActive: users
      .sort((a, b) => calculateActivityScore(b) - calculateActivityScore(a))
      .slice(0, 20)
      .map((user, index) => ({
        user,
        rank: index + 1,
        score: calculateActivityScore(user),
        category: 'most_active' as const
      })),
    mostCreative: createRanking(users, 'designsCreated', 'most_creative'),
    mostShared: createRanking(users, 'sharedLinks', 'most_shared'),
    mostViewed: createRanking(users, 'designsViewed', 'most_viewed')
  };
};

export const filterCanvaUsers = (
  users: CanvaUser[],
  filters: {
    search?: string;
    school?: string;
    compliance?: 'all' | 'compliant' | 'non_compliant';
    period?: string;
  }
): CanvaUser[] => {
  return users.filter(user => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!user.name.toLowerCase().includes(search) && 
          !user.email.toLowerCase().includes(search)) {
        return false;
      }
    }

    if (filters.school && filters.school !== 'all' && user.school !== filters.school) {
      return false;
    }

    if (filters.compliance && filters.compliance !== 'all') {
      const isCompliant = filters.compliance === 'compliant';
      if (user.isCompliant !== isCompliant) {
        return false;
      }
    }

    if (filters.period && filters.period !== 'all' && user.period !== filters.period) {
      return false;
    }

    return true;
  });
};

export const exportCanvaData = (users: CanvaUser[]): string => {
  const headers = [
    'Nome', 'Email', 'Função', 'Escola', 'Status Política', 
    'Designs Criados', 'Designs Publicados', 'Links Compartilhados', 
    'Designs Visualizados', 'Última Atividade'
  ];

  const rows = users.map(user => [
    user.name,
    user.email,
    user.role,
    user.school || 'A preencher',
    user.isCompliant ? 'Conforme' : 'Fora da política',
    user.designsCreated.toString(),
    user.designsPublished.toString(),
    user.sharedLinks.toString(),
    user.designsViewed.toString(),
    user.lastActivity
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

// License action history management
export const saveLicenseAction = (action: LicenseAction): void => {
  const existing = getLicenseHistory();
  const updated = [action, ...existing].slice(0, 1000); // Keep last 1000 actions
  localStorage.setItem('canva_license_history', JSON.stringify(updated));
};

export const getLicenseHistory = (): LicenseAction[] => {
  try {
    const stored = localStorage.getItem('canva_license_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const filterLicenseHistory = (filters: {
  schoolId?: string;
  action?: string;
  dateRange?: { start: Date; end: Date };
}): LicenseAction[] => {
  let history = getLicenseHistory();
  
  if (filters.schoolId) {
    history = history.filter(h => h.schoolId === filters.schoolId);
  }
  
  if (filters.action) {
    history = history.filter(h => h.action === filters.action);
  }
  
  if (filters.dateRange) {
    history = history.filter(h => {
      const actionDate = new Date(h.timestamp);
      return actionDate >= filters.dateRange!.start && actionDate <= filters.dateRange!.end;
    });
  }
  
  return history;
};
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

const parseUsersCSV = (csvContent: string): { [email: string]: { school: string; schoolId: string } } => {
  const lines = csvContent.split('\n');
  const userSchoolMap: { [email: string]: { school: string; schoolId: string } } = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(';');
    if (columns.length < 5) continue;

    const email = columns[1]?.trim();
    const school = columns[3]?.trim();
    const schoolId = columns[4]?.trim();

    if (email && school) {
      userSchoolMap[email] = { school, schoolId: schoolId || 'unknown' };
    }
  }

  return userSchoolMap;
};

export const loadCanvaData = async (period: '30d' | '3m' | '6m' | '12m' = '30d'): Promise<CanvaUser[]> => {
  try {
    const fileName = {
      '30d': 'relatorio_canva_30_dias.csv',
      '3m': 'relatorio_canva_3_meses.csv', 
      '6m': 'relatorio_canva_6_meses.csv',
      '12m': 'relatorio_canva_12_meses.csv'
    }[period];

    const [canvaResponse, usersResponse] = await Promise.all([
      fetch(`/data/${fileName}`),
      fetch('/data/usuarios_canva_completos.csv')
    ]);

    if (!canvaResponse.ok || !usersResponse.ok) {
      throw new Error('Erro ao carregar dados do Canva');
    }

    const canvaCSV = await canvaResponse.text();
    const usersCSV = await usersResponse.text();

    const canvaUsers = parseCanvaReportCSV(canvaCSV, period);
    const userSchoolMap = parseUsersCSV(usersCSV);

    // Enriquecer dados dos usuários com informações da escola
    return canvaUsers.map(user => ({
      ...user,
      school: userSchoolMap[user.email]?.school || 'A preencher em breve',
      schoolId: userSchoolMap[user.email]?.schoolId || 'unassigned'
    }));

  } catch (error) {
    console.error('Erro ao carregar dados do Canva:', error);
    return [];
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

    schoolsData.push({
      schoolId,
      schoolName,
      maxLicenses: 2,
      usedLicenses: schoolUsers.length,
      availableLicenses: Math.max(0, 2 - schoolUsers.length),
      users: schoolUsers,
      nonCompliantUsers,
      totalActivity,
      performance,
      utilizationRate
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
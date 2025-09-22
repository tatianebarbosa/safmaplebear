import { 
  OfficialSchool, 
  OfficialUser, 
  ProcessedSchoolData, 
  CanvaOverviewData 
} from '@/types/officialData';

// Domínios válidos Maple Bear
const VALID_DOMAINS = ['maplebear.com.br', 'co.maplebear.com.br', 'mbcentral.com.br'];

export const isEmailCompliant = (email: string): boolean => {
  const domain = email.toLowerCase().split('@')[1];
  return VALID_DOMAINS.some(validDomain => domain?.includes('maplebear'));
};

export const parseOfficialSchoolsCSV = async (): Promise<OfficialSchool[]> => {
  try {
    const response = await fetch('/data/franchising_oficial.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(';');
    const schools: OfficialSchool[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length < 4) continue;
      
      const school: OfficialSchool = {
        id: values[3]?.trim() || `school-${i}`,
        name: values[4]?.trim() || 'Escola Sem Nome',
        status: mapSchoolStatus(values[5]?.trim()),
        cluster: values[6]?.trim() || 'Outros',
        safManager: values[7]?.trim(),
        cnpj: values[8]?.trim(),
        address: values[9]?.trim(),
        city: values[12]?.trim(),
        state: values[13]?.trim(),
        region: values[14]?.trim(),
        phone: values[15]?.trim(),
        email: values[16]?.trim(),
      };
      
      schools.push(school);
    }
    
    return schools;
  } catch (error) {
    console.error('Erro ao carregar escolas oficiais:', error);
    return [];
  }
};

export const parseOfficialUsersCSV = async (): Promise<OfficialUser[]> => {
  try {
    const response = await fetch('/data/usuarios_canva_oficial.csv');
    const text = await response.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return [];
    
    const users: OfficialUser[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';');
      if (values.length < 3 || !values[1]?.trim()) continue;
      
      const email = values[1]?.trim();
      const user: OfficialUser = {
        id: `user-${i}`,
        name: values[0]?.trim() || email.split('@')[0],
        email: email,
        role: mapUserRole(values[2]?.trim()),
        school: values[3]?.trim(),
        schoolId: values[4]?.trim(),
        licenseStatus: values[5]?.trim(),
        updatedAt: values[6]?.trim(),
        isCompliant: isEmailCompliant(email),
      };
      
      users.push(user);
    }
    
    return users;
  } catch (error) {
    console.error('Erro ao carregar usuários oficiais:', error);
    return [];
  }
};

const mapSchoolStatus = (status: string): 'Ativa' | 'Implantando' | 'Pausa' => {
  const statusLower = status?.toLowerCase();
  if (statusLower?.includes('ativa')) return 'Ativa';
  if (statusLower?.includes('implant')) return 'Implantando';
  return 'Pausa';
};

const mapUserRole = (role: string): 'Estudante' | 'Professor' | 'Administrador' => {
  const roleLower = role?.toLowerCase();
  if (roleLower?.includes('professor')) return 'Professor';
  if (roleLower?.includes('admin')) return 'Administrador';
  return 'Estudante';
};

export const processSchoolsWithUsers = async (): Promise<ProcessedSchoolData[]> => {
  const [schools, users] = await Promise.all([
    parseOfficialSchoolsCSV(),
    parseOfficialUsersCSV()
  ]);
  
  const schoolsMap = new Map(schools.map(s => [s.id, s]));
  const schoolsByName = new Map(schools.map(s => [s.name.toLowerCase(), s]));
  
  // Agrupar usuários por escola
  const usersBySchool = new Map<string, OfficialUser[]>();
  
  users.forEach(user => {
    let school: OfficialSchool | undefined;
    
    // Tentar encontrar escola por ID primeiro
    if (user.schoolId) {
      school = schoolsMap.get(user.schoolId);
    }
    
    // Se não encontrou por ID, tentar por nome
    if (!school && user.school) {
      school = schoolsByName.get(user.school.toLowerCase());
      // Tentar busca parcial se não encontrou exata
      if (!school) {
        for (const [name, s] of schoolsByName) {
          if (name.includes(user.school.toLowerCase()) || user.school.toLowerCase().includes(name)) {
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
  
  // Processar escolas com usuários
  for (const school of schools) {
    const schoolUsers = usersBySchool.get(school.id) || [];
    const compliantUsers = schoolUsers.filter(u => u.isCompliant).length;
    const nonCompliantUsers = schoolUsers.length - compliantUsers;
    
    // Estimar licenças baseado no status da escola
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
  
  // Adicionar usuários sem escola
  const usersWithoutSchool = usersBySchool.get('no-school') || [];
  if (usersWithoutSchool.length > 0) {
    const compliantUsers = usersWithoutSchool.filter(u => u.isCompliant).length;
    
    processedData.push({
      school: {
        id: 'no-school',
        name: 'Usuários Sem Escola Definida',
        status: 'Pausa',
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
  // Lógica para estimar licenças baseado no status da escola
  if (school.status === 'Ativa') {
    // Escolas ativas: estimar baseado no número de usuários com margem
    return Math.max(10, Math.ceil(userCount * 1.2));
  } else if (school.status === 'Implantando') {
    // Escolas implantando: licenças menores
    return Math.max(5, userCount);
  }
  return userCount; // Pausadas
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
  
  // Contar domínios não Maple Bear
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
    schoolsAtCapacity: Math.floor(activeSchools * 0.6), // Estimativa
  };
};
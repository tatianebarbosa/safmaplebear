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

export function parseSchoolsCSV(csvContent: string): School[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(';');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(';');
      
      const schoolId = values[3] || '';
      const schoolName = values[4] || '';
      const status = values[5] || 'Ativa';
      const cluster = values[6] || '';
      const cnpj = values[8] || '';
      const city = values[12] || '';
      const state = values[13] || '';
      const region = values[14] || '';
      const phone = values[15] || '';
      const email = values[16] || '';
      
      return {
        id: schoolId,
        name: schoolName,
        status: status as 'Ativa' | 'Implantando' | 'Inativa',
        cluster,
        city,
        state,
        region,
        email,
        phone,
        cnpj,
        maxLicenses: 2, // Padrão de 2 licenças por escola
        usedLicenses: 0,
        users: []
      };
    })
    .filter(school => school.id && school.name);
}

export function parseUsersCSV(csvContent: string): SchoolUser[] {
  const lines = csvContent.split('\n');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(';');
      
      return {
        name: values[0] || '',
        email: values[1] || '',
        role: values[2] || '',
        school: values[3] || '',
        schoolId: values[4] || '',
        licenseStatus: values[5] || '',
        updatedAt: values[6] || ''
      };
    })
    .filter(user => user.email);
}

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
  // Criar um mapa de escolas por nome para facilitar a busca
  const schoolMap = new Map<string, School>();
  schools.forEach(school => {
    schoolMap.set(school.name, school);
  });
  
  // Agrupar usuários por escola
  const usersBySchool = new Map<string, SchoolUser[]>();
  users.forEach(user => {
    if (user.school) {
      if (!usersBySchool.has(user.school)) {
        usersBySchool.set(user.school, []);
      }
      usersBySchool.get(user.school)!.push(user);
    }
  });
  
  // Combinar dados
  return schools.map(school => {
    const schoolUsers = usersBySchool.get(school.name) || [];
    const activeUsers = schoolUsers.filter(user => 
      user.licenseStatus === 'Ativa' || 
      (user.email.includes('@maplebear.com.br') && user.school === school.name)
    );
    
    return {
      ...school,
      users: schoolUsers,
      usedLicenses: Math.min(activeUsers.length, school.maxLicenses + 5) // Permitir excesso até 5
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
    const [schoolsResponse, usersResponse] = await Promise.all([
      fetch('/data/escolas.csv'),
      fetch('/data/usuarios_updated.csv')
    ]);
    
    const schoolsCSV = await schoolsResponse.text();
    const usersCSV = await usersResponse.text();
    
    const schools = parseSchoolsCSV(schoolsCSV);
    const users = parseUsersCSV(usersCSV);
    
    return combineSchoolsAndUsers(schools, users);
  } catch (error) {
    console.error('Erro ao carregar dados das escolas:', error);
    return [];
  }
}
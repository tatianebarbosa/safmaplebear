export interface UserData {
  name: string;
  email: string;
  role: string;
  school: string;
  schoolId: string;
  licenseStatus: string;
  updatedAt: string;
}

export interface EmailAnalysis {
  maplebearEmails: UserData[];
  sebEmails: UserData[];
  sebsaEmails: UserData[];
  externalEmails: UserData[];
  totalMaplebearUsers: number;
  totalSebUsers: number;
  totalSebsaUsers: number;
  totalExternalUsers: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'maintenance';
  permissions: string[];
}

export function parseUsersCSV(csvContent: string): UserData[] {
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
    .filter(user => user.email && user.email.includes('@'));
}

export function analyzeEmails(users: UserData[]): EmailAnalysis {
  const maplebearEmails = users.filter(user => 
    user.email.includes('@maplebear.com.br') || 
    user.email.includes('@co.maplebear.com.br') ||
    user.email.includes('@te.maplebear.com.br') ||
    user.email.includes('@bsb.maplebear.com.br') ||
    user.email.includes('@pr.maplebear.com.br') ||
    user.email.includes('@sudoeste.maplebear.com.br') ||
    user.email.includes('@asanorte.maplebear.com.br') ||
    user.email.includes('@mbcentral.com.br')
  );

  const sebEmails = users.filter(user => 
    user.email.includes('@seb.com.br')
  );

  const sebsaEmails = users.filter(user => 
    user.email.includes('@sebsa.com.br')
  );

  const externalEmails = users.filter(user => 
    !user.email.includes('@maplebear.com.br') && 
    !user.email.includes('@co.maplebear.com.br') &&
    !user.email.includes('@te.maplebear.com.br') &&
    !user.email.includes('@bsb.maplebear.com.br') &&
    !user.email.includes('@pr.maplebear.com.br') &&
    !user.email.includes('@sudoeste.maplebear.com.br') &&
    !user.email.includes('@asanorte.maplebear.com.br') &&
    !user.email.includes('@mbcentral.com.br') &&
    !user.email.includes('@seb.com.br') &&
    !user.email.includes('@sebsa.com.br')
  );

  return {
    maplebearEmails,
    sebEmails,
    sebsaEmails,
    externalEmails,
    totalMaplebearUsers: maplebearEmails.length,
    totalSebUsers: sebEmails.length,
    totalSebsaUsers: sebsaEmails.length,
    totalExternalUsers: externalEmails.length
  };
}

export function getUsersBySchool(users: UserData[]): Map<string, UserData[]> {
  const usersBySchool = new Map<string, UserData[]>();
  
  users.forEach(user => {
    if (user.school) {
      if (!usersBySchool.has(user.school)) {
        usersBySchool.set(user.school, []);
      }
      usersBySchool.get(user.school)!.push(user);
    }
  });
  
  return usersBySchool;
}

export function getClusterSAFResponsibles(users: UserData[]): UserData[] {
  // Filtrar usuários que podem ser responsáveis SAF baseado no email/função
  return users.filter(user => 
    user.email.includes('@seb.com.br') || 
    user.email.includes('@sebsa.com.br') ||
    user.role.toLowerCase().includes('admin') ||
    user.role.toLowerCase().includes('coordenador') ||
    user.role.toLowerCase().includes('gerente') ||
    user.role.toLowerCase().includes('diretor')
  );
}

export async function loadUserData(): Promise<UserData[]> {
  try {
    const response = await fetch('/data/usuarios_updated.csv');
    const csvContent = await response.text();
    return parseUsersCSV(csvContent);
  } catch (error) {
    console.error('Erro ao carregar dados dos usuários:', error);
    return [];
  }
}

// Sistema de perfis
export const userProfiles: UserProfile[] = [
  {
    id: '1',
    name: 'Administrador',
    email: 'admin@maplebear.com.br',
    role: 'admin',
    permissions: ['view_all', 'edit_licenses', 'manage_users', 'view_reports', 'monitoring']
  },
  {
    id: '2',
    name: 'Usuário SAF',
    email: 'saf@sebsa.com.br',
    role: 'user',
    permissions: ['view_schools', 'view_reports']
  },
  {
    id: '3',
    name: 'Manutenção',
    email: 'manutencao@maplebear.com.br',
    role: 'maintenance',
    permissions: ['view_all', 'edit_all', 'system_config']
  }
];

export function getCurrentUserProfile(): UserProfile | null {
  const currentUser = localStorage.getItem('currentUser');
  if (!currentUser) return null;
  
  const user = JSON.parse(currentUser);
  return userProfiles.find(profile => profile.email === user.email) || null;
}

export function hasPermission(permission: string): boolean {
  const profile = getCurrentUserProfile();
  return profile?.permissions.includes(permission) || false;
}
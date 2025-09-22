export interface CanvaUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  unit: string;
  unitCode: string;
  addedDate?: string;
  modifiedDate?: string;
  modifiedBy?: string;
  isActive: boolean;
}

export interface UserChange {
  id: string;
  userId: string;
  unitId: string;
  action: 'add' | 'remove' | 'modify' | 'reactivate' | 'deactivate';
  justification: string;
  performedBy: string;
  performedAt: string;
  oldData?: Partial<CanvaUser>;
  newData?: Partial<CanvaUser>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByUnit: { [unitName: string]: number };
  recentChanges: number;
}

// Simula dados dos usuários Canva processados
export const loadCanvaUsers = async (): Promise<CanvaUser[]> => {
  // Em produção, isso viria do arquivo Excel ou API
  const mockUsers: CanvaUser[] = [
    {
      id: '1',
      name: 'Ana Paula Guerra dos Santos',
      email: 'anapau.santos@mbcentral.com.br',
      role: 'Coordenadora',
      status: 'Ativo',
      unit: 'Maple Bear Central',
      unitCode: 'CENTRAL',
      isActive: true,
      addedDate: '2024-01-15'
    },
    {
      id: '2', 
      name: 'Ingrid Silva',
      email: 'ingrid.silva@maplebear.com.br',
      role: 'Consultora SAF',
      status: 'Ativo',
      unit: 'Maple Bear Minas Gerais',
      unitCode: 'MG01',
      isActive: true,
      addedDate: '2024-02-10'
    },
    {
      id: '3',
      name: 'Rafhael Santos',
      email: 'rafhael.santos@maplebear.com.br', 
      role: 'Consultor SAF',
      status: 'Ativo',
      unit: 'Maple Bear São Paulo',
      unitCode: 'SP01',
      isActive: true,
      addedDate: '2024-03-05'
    },
    {
      id: '4',
      name: 'João Oliveira',
      email: 'joao.oliveira@maplebear.com.br',
      role: 'Consultor SAF', 
      status: 'Ativo',
      unit: 'Maple Bear Rio de Janeiro',
      unitCode: 'RJ01',
      isActive: true,
      addedDate: '2024-01-20'
    }
  ];

  return mockUsers;
};

export const getUserStats = (users: CanvaUser[]): UserStats => {
  const activeUsers = users.filter(u => u.isActive);
  const usersByUnit = users.reduce((acc, user) => {
    acc[user.unit] = (acc[user.unit] || 0) + 1;
    return acc;
  }, {} as { [unitName: string]: number });

  return {
    totalUsers: users.length,
    activeUsers: activeUsers.length,
    inactiveUsers: users.length - activeUsers.length,
    usersByUnit,
    recentChanges: 0 // Implementar contagem de mudanças recentes
  };
};

export const getUserChanges = (): UserChange[] => {
  // Carregar do localStorage por enquanto
  return JSON.parse(localStorage.getItem('canvaUserChanges') || '[]');
};

export const saveUserChange = (change: Omit<UserChange, 'id' | 'performedAt'>): void => {
  const changes = getUserChanges();
  const newChange: UserChange = {
    ...change,
    id: Date.now().toString(),
    performedAt: new Date().toISOString()
  };
  
  changes.push(newChange);
  localStorage.setItem('canvaUserChanges', JSON.stringify(changes));
};

export const filterCanvaUsers = (
  users: CanvaUser[],
  filters: {
    search?: string;
    unit?: string;
    status?: string;
    role?: string;
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

    if (filters.unit && filters.unit !== 'all' && user.unit !== filters.unit) {
      return false;
    }

    if (filters.status && filters.status !== 'all') {
      const isActive = filters.status === 'active';
      if (user.isActive !== isActive) {
        return false;
      }
    }

    if (filters.role && filters.role !== 'all' && user.role !== filters.role) {
      return false;
    }

    return true;
  });
};
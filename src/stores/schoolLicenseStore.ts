import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { School, Justification, SchoolUser, CanvaUsageData } from '@/types/schoolLicense';

interface SchoolLicenseState {
  schools: School[];
  justifications: Justification[];
  usageData: CanvaUsageData[];
  
  // Actions
  setSchools: (schools: School[]) => void;
  addSchool: (school: Omit<School, 'id'>) => void;
  updateSchool: (id: string, updates: Partial<School>) => void;
  
  addUser: (schoolId: string, user: Omit<SchoolUser, 'id' | 'createdAt'>) => void;
  updateUser: (schoolId: string, userId: string, updates: Partial<SchoolUser>) => void;
  removeUser: (schoolId: string, userId: string) => void;
  
  swapUser: (schoolId: string, oldUserId: string, newUser: Omit<SchoolUser, 'id' | 'createdAt'>, justification: Omit<Justification, 'id' | 'timestamp'>) => void;
  
  addJustification: (justification: Omit<Justification, 'id' | 'timestamp'>) => void;
  getJustificationsBySchool: (schoolId: string) => Justification[];
  
  setUsageData: (data: CanvaUsageData[]) => void;
  
  // Helpers
  isEmailValid: (email: string) => boolean;
  getLicenseStatus: (school: School) => 'Disponível' | 'Completo' | 'Excedido';
  getNonMapleBearCount: () => number;
  getDomainCounts: () => Array<{ domain: string; count: number }>;
}

// Seed data
const seedSchools: School[] = [
  {
    id: '1',
    name: 'A definir escola em breve',
    status: 'Implantando',
    cluster: 'Outros/Implantação',
    totalLicenses: 2,
    usedLicenses: 0,
    users: [],
    hasRecentJustifications: false,
  },
  {
    id: '2',
    name: 'Maple Bear Centro',
    status: 'Ativa',
    city: 'São Paulo',
    cluster: 'Alta Performance',
    totalLicenses: 10,
    usedLicenses: 10,
    users: [
      {
        id: '1',
        name: 'João Silva',
        email: 'joao.silva@maplebear.com.br',
        role: 'Professor',
        isCompliant: true,
        createdAt: new Date().toISOString(),
      },
      // Add more users to reach 10
    ],
    hasRecentJustifications: false,
  },
  {
    id: '3',
    name: 'Maple Bear Vila Nova',
    status: 'Ativa',
    city: 'Rio de Janeiro',
    cluster: 'Potente',
    totalLicenses: 8,
    usedLicenses: 12,
    users: [
      {
        id: '2',
        name: 'Maria Santos',
        email: 'maria@gmail.com',
        role: 'Estudante',
        isCompliant: false,
        createdAt: new Date().toISOString(),
      },
      // Add more users to simulate excess
    ],
    hasRecentJustifications: true,
  },
];

// Complete seed users for the schools
seedSchools[1].users = Array.from({ length: 10 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `Usuario ${i + 1}`,
  email: `usuario${i + 1}@maplebear.com.br`,
  role: i < 3 ? 'Professor' : 'Estudante',
  isCompliant: true,
  createdAt: new Date().toISOString(),
}));

seedSchools[2].users = Array.from({ length: 12 }, (_, i) => ({
  id: `user-${i + 20}`,
  name: `Usuario ${i + 20}`,
  email: i < 6 ? `usuario${i + 20}@gmail.com` : `usuario${i + 20}@maplebear.com.br`,
  role: i < 4 ? 'Professor' : 'Estudante',
  isCompliant: i >= 6,
  createdAt: new Date().toISOString(),
}));

export const useSchoolLicenseStore = create<SchoolLicenseState>()(
  persist(
    (set, get) => ({
      schools: seedSchools,
      justifications: [],
      usageData: [],

      setSchools: (schools) => set({ schools }),

      addSchool: (school) => set(state => ({
        schools: [...state.schools, { ...school, id: Date.now().toString() }]
      })),

      updateSchool: (id, updates) => set(state => ({
        schools: state.schools.map(school => 
          school.id === id ? { ...school, ...updates } : school
        )
      })),

      addUser: (schoolId, user) => set(state => ({
        schools: state.schools.map(school => 
          school.id === schoolId 
            ? { 
                ...school, 
                users: [...school.users, {
                  ...user,
                  id: Date.now().toString(),
                  createdAt: new Date().toISOString(),
                  isCompliant: get().isEmailValid(user.email)
                }],
                usedLicenses: school.users.length + 1
              }
            : school
        )
      })),

      updateUser: (schoolId, userId, updates) => set(state => ({
        schools: state.schools.map(school => 
          school.id === schoolId 
            ? {
                ...school,
                users: school.users.map(user => 
                  user.id === userId 
                    ? { 
                        ...user, 
                        ...updates,
                        isCompliant: updates.email ? get().isEmailValid(updates.email) : user.isCompliant
                      }
                    : user
                )
              }
            : school
        )
      })),

      removeUser: (schoolId, userId) => set(state => ({
        schools: state.schools.map(school => 
          school.id === schoolId 
            ? { 
                ...school, 
                users: school.users.filter(user => user.id !== userId),
                usedLicenses: Math.max(0, school.usedLicenses - 1)
              }
            : school
        )
      })),

      swapUser: (schoolId, oldUserId, newUser, justificationData) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const oldUser = school?.users.find(u => u.id === oldUserId);
        
        if (!school || !oldUser) return;

        const justification: Justification = {
          ...justificationData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          oldUser: {
            name: oldUser.name,
            email: oldUser.email,
            role: oldUser.role,
          },
          newUser: {
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
          }
        };

        set(state => ({
          schools: state.schools.map(s => 
            s.id === schoolId 
              ? { 
                  ...s, 
                  users: s.users.map(u => 
                    u.id === oldUserId 
                      ? {
                          ...u,
                          name: newUser.name,
                          email: newUser.email,
                          role: newUser.role,
                          isCompliant: get().isEmailValid(newUser.email)
                        }
                      : u
                  ),
                  hasRecentJustifications: true
                }
              : s
          ),
          justifications: [...state.justifications, justification]
        }));
      },

      addJustification: (justification) => set(state => ({
        justifications: [...state.justifications, {
          ...justification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        }]
      })),

      getJustificationsBySchool: (schoolId) => {
        return get().justifications.filter(j => j.schoolId === schoolId);
      },

      setUsageData: (data) => set({ usageData: data }),

      isEmailValid: (email) => {
        return email.toLowerCase().includes('maplebear');
      },

      getLicenseStatus: (school) => {
        if (school.usedLicenses > school.totalLicenses) return 'Excedido';
        if (school.usedLicenses === school.totalLicenses) return 'Completo';
        return 'Disponível';
      },

      getNonMapleBearCount: () => {
        const { schools, isEmailValid } = get();
        return schools.reduce((count, school) => 
          count + school.users.filter(user => !isEmailValid(user.email)).length, 0
        );
      },

      getDomainCounts: () => {
        const { schools } = get();
        const domainCounts: { [key: string]: number } = {};
        
        schools.forEach(school => {
          school.users.forEach(user => {
            const domain = user.email.split('@')[1]?.toLowerCase();
            if (domain && !domain.includes('maplebear')) {
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
            }
          });
        });
        
        return Object.entries(domainCounts)
          .map(([domain, count]) => ({ domain, count }))
          .sort((a, b) => b.count - a.count);
      },
    }),
    {
      name: 'school-license-storage',
    }
  )
);
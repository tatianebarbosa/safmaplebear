import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { School, Justification, SchoolUser, CanvaUsageData } from '@/types/schoolLicense';
import { 
  processSchoolsWithUsers, 
  generateCanvaOverview,
  isEmailCompliant 
} from '@/lib/officialDataProcessor';
import { ProcessedSchoolData, CanvaOverviewData } from '@/types/officialData';

interface SchoolLicenseState {
  schools: School[];
  justifications: Justification[];
  usageData: CanvaUsageData[];
  officialData: ProcessedSchoolData[];
  overviewData: CanvaOverviewData | null;
  loading: boolean;
  
  // Actions
  loadOfficialData: () => Promise<void>;
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

// Dados iniciais vazios - serão carregados dos dados oficiais
const seedSchools: School[] = [];

export const useSchoolLicenseStore = create<SchoolLicenseState>()(
  persist(
    (set, get) => ({
      schools: seedSchools,
      justifications: [],
      usageData: [],
      officialData: [],
      overviewData: null,
      loading: false,

      loadOfficialData: async () => {
        set({ loading: true });
        try {
          const [processedData, overview] = await Promise.all([
            processSchoolsWithUsers(),
            generateCanvaOverview()
          ]);
          
          if (!processedData || !overview) {
            // Se os dados não puderam ser carregados, definimos um estado de erro
            set({ 
              officialData: [],
              overviewData: null,
              schools: [],
              loading: false
            });
            return;
          }
          
          // Converter dados oficiais para formato do sistema
          const convertedSchools: School[] = processedData.map(data => ({
            id: data.school.id,
            name: data.school.name,
            status: data.school.status,
            city: data.school.city,
            cluster: data.school.cluster as any,
            totalLicenses: data.estimatedLicenses,
            usedLicenses: data.totalUsers,
            users: data.users.map(user => ({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role as any,
              isCompliant: user.isCompliant,
              createdAt: new Date().toISOString(),
            })),
            hasRecentJustifications: false,
          }));
          
          set({ 
            officialData: processedData,
            overviewData: overview,
            schools: convertedSchools,
            loading: false
          });
        } catch (error) {
          console.error('Erro ao carregar dados oficiais:', error);
          set({ loading: false });
        }
      },

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
        return isEmailCompliant(email);
      },

      getLicenseStatus: (school) => {
        if (school.usedLicenses > school.totalLicenses) return 'Excedido';
        if (school.usedLicenses === school.totalLicenses) return 'Completo';
        return 'Disponível';
      },

      getNonMapleBearCount: () => {
        const { overviewData } = get();
        return overviewData?.nonMapleBearDomains || 0;
      },

      getDomainCounts: () => {
        const { overviewData } = get();
        return overviewData?.topNonCompliantDomains || [];
      },
    }),
    {
      name: 'school-license-storage',
    }
  )
);
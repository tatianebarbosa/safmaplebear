import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { School, Justification, SchoolUser, CanvaUsageData, HistoryEntry } from '@/types/schoolLicense';
import { 
  processSchoolsWithUsers, 
  generateCanvaOverview,
  isEmailCompliant 
} from '@/lib/officialDataProcessor';
import { ProcessedSchoolData, CanvaOverviewData } from '@/types/officialData';

interface SchoolLicenseState {
  schools: School[];
  justifications: Justification[];
  history: HistoryEntry[]; // Novo estado para o histórico de alterações
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
  
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void; // Nova ação para adicionar entrada de histórico
  getHistoryBySchool: (schoolId: string) => HistoryEntry[]; // Nova ação para obter histórico
  
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
      history: [], // Inicialização do novo estado
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

      addUser: (schoolId, user) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        if (!school) return state;

        const newUser = {
          ...user,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isCompliant: state.isEmailValid(user.email)
        };

        // 1. Adicionar entrada de histórico
        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'GRANT_LICENSE',
          details: `Licença concedida ao usuário ${newUser.name} (${newUser.email}) com o papel de ${newUser.role}.`,
          performedBy: 'Sistema/Usuário' // TODO: Implementar autenticação para obter o usuário real
        });

        // 2. Atualizar o estado da escola
        return {
          schools: state.schools.map(s => 
            s.id === schoolId 
              ? { 
                  ...s, 
                  users: [...s.users, newUser],
                  usedLicenses: s.users.length + 1
                }
              : s
          )
        };
      },

      updateUser: (schoolId, userId, updates) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const oldUser = school?.users.find(u => u.id === userId);
        if (!school || !oldUser) return state;

        const updatedUser = {
          ...oldUser,
          ...updates,
          isCompliant: updates.email ? state.isEmailValid(updates.email) : oldUser.isCompliant
        };

        // 1. Adicionar entrada de histórico
        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'UPDATE_USER',
          details: `Usuário ${oldUser.name} (${oldUser.email}) atualizado. Alterações: ${Object.keys(updates).join(', ')}.`,
          performedBy: 'Sistema/Usuário' // TODO: Implementar autenticação para obter o usuário real
        });

        // 2. Atualizar o estado da escola
        return {
          schools: state.schools.map(s => 
            s.id === schoolId 
              ? {
                  ...s,
                  users: s.users.map(u => 
                    u.id === userId 
                      ? updatedUser
                      : u
                  )
                }
              : s
          )
        };
      },

      removeUser: (schoolId, userId) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const userToRemove = school?.users.find(u => u.id === userId);
        if (!school || !userToRemove) return state;

        // 1. Adicionar entrada de histórico
        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'REMOVE_USER',
          details: `Usuário ${userToRemove.name} (${userToRemove.email}) removido. Licença liberada.`,
          performedBy: 'Sistema/Usuário' // TODO: Implementar autenticação para obter o usuário real
        });

        // 2. Atualizar o estado da escola
        return {
          schools: state.schools.map(s => 
            s.id === schoolId 
              ? { 
                  ...s, 
                  users: s.users.filter(user => user.id !== userId),
                  usedLicenses: Math.max(0, s.usedLicenses - 1)
                }
              : s
          )
        };
      },

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

          // 1. Adicionar entrada de histórico
          state.addHistoryEntry({
            schoolId: school.id,
            schoolName: school.name,
            action: 'TRANSFER_LICENSE',
            details: `Licença transferida de ${oldUser.name} (${oldUser.email}) para ${newUser.name} (${newUser.email}). Motivo: ${justificationData.reason}.`,
            performedBy: justificationData.performedBy
          });
	
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

      addHistoryEntry: (entry) => set(state => ({
        history: [...state.history, {
          ...entry,
          id: Date.now().toString(),
          timestamp: new Date().toISOString()
        }]
      })),

      getHistoryBySchool: (schoolId) => {
        return get().history.filter(h => h.schoolId === schoolId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
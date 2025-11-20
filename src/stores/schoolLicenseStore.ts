import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { School, Justification, SchoolUser, CanvaUsageData, HistoryEntry, HistoryAction, HistoryChangeSet } from '@/types/schoolLicense';
import { getLicenseLimitForSchool, MAX_LICENSES_PER_SCHOOL } from '@/config/licenseLimits';
import {
  processSchoolsWithUsers,
  generateCanvaOverview,
  isEmailCompliant,
  parseOfficialSchoolsCSV
} from '@/lib/officialDataProcessor';
import {
  buildOverviewFromIntegration,
  buildProcessedSchoolsFromIntegration,
  fetchIntegratedCanvaData
} from '@/lib/integratedCanvaService';
import { ProcessedSchoolData, CanvaOverviewData } from '@/types/officialData';

type AddUserMeta = {
  origemSolicitacao: 'Ticket SAF' | 'E-mail';
  solicitadoPorNome: string;
  solicitadoPorEmail: string;
  observacao: string;
  performedBy?: string;
};

type ActionMeta = {
  performedBy?: string;
  reason?: string;
};

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
  
  addUser: (schoolId: string, user: Omit<SchoolUser, 'id' | 'createdAt'>, meta: AddUserMeta) => boolean;
  updateUser: (schoolId: string, userId: string, updates: Partial<SchoolUser>, meta?: ActionMeta) => void;
  removeUser: (schoolId: string, userId: string, meta?: ActionMeta) => void;

swapUser: (schoolId: string, oldUserId: string, newUser: Omit<SchoolUser, 'id' | 'createdAt'>, justification: Omit<Justification, 'id' | 'timestamp'>) => void;
  transferUsersBetweenSchools: (
    sourceSchoolId: string,
    sourceUserId: string,
    targetSchoolId: string,
    targetUserId: string,
    justification: Pick<Justification, 'reason' | 'performedBy'>
  ) => void;
  
  addJustification: (justification: Omit<Justification, 'id' | 'timestamp'>) => void;
  getJustificationsBySchool: (schoolId: string) => Justification[];
  
  addHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'reverted'>) => void; // Nova ação para adicionar entrada de histórico
  getHistoryBySchool: (schoolId: string) => HistoryEntry[]; // Nova ação para obter histórico
  revertHistoryEntry: (historyId: string, meta: { reason: string; performedBy: string }) => boolean;
  
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
          const finalizeData = (processedData: ProcessedSchoolData[], overview: CanvaOverviewData) => {
            const convertedSchools: School[] = processedData.map(data => ({
              id: data.school.id,
              name: data.school.name,
              status: data.school.status,
              city: data.school.city,
            cluster: data.school.cluster as any,
            totalLicenses: data.school.id === 'no-school'
              ? Math.max(data.estimatedLicenses, 1)
              : MAX_LICENSES_PER_SCHOOL,
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
          };

          const integratedData = await fetchIntegratedCanvaData();
          if (integratedData) {
            const officialSchools = await parseOfficialSchoolsCSV();
            const processedFromIntegration = buildProcessedSchoolsFromIntegration(integratedData, officialSchools);
            const overviewFromIntegration = buildOverviewFromIntegration(
              integratedData,
              officialSchools,
              processedFromIntegration
            );
            finalizeData(processedFromIntegration, overviewFromIntegration);
            return;
          }

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

          finalizeData(processedData, overview);
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

      addUser: (schoolId, user, meta) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        if (!school) return false;

        const licenseLimit = getLicenseLimitForSchool(school.totalLicenses);
        if (school.users.length >= licenseLimit) {
          return false;
        }

        const newUser: SchoolUser = {
          ...user,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isCompliant: state.isEmailValid(user.email)
        };

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'ADD_USER',
          details: `Novo usuario adicionado: ${user.name} (${user.email}). Origem: ${meta.origemSolicitacao}. Solicitado por: ${meta.solicitadoPorNome} (${meta.solicitadoPorEmail}). Motivo: ${meta.observacao}.`,
          performedBy: meta.performedBy || 'Sistema/Usuario',
          changeSet: {
            type: 'GRANT_LICENSE',
            user: newUser
          }
        });

        set(state => ({
          schools: state.schools.map(s =>
            s.id === schoolId
              ? {
                  ...s,
                  users: [...s.users, newUser],
                  usedLicenses: s.users.length + 1
                }
              : s
          )
        }));

        return true;
      },

      updateUser: (schoolId, userId, updates, meta) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const oldUser = school?.users.find(u => u.id === userId);
        if (!school || !oldUser) return;

        const actionMeta: ActionMeta = meta ?? { performedBy: 'Sistema/Usuario' };
        const previousUser = { ...oldUser };
        const updatedUser: SchoolUser = {
          ...oldUser,
          ...updates,
          isCompliant: updates.email ? state.isEmailValid(updates.email) : oldUser.isCompliant
        };

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'UPDATE_USER',
          details: `Usuario ${oldUser.name} (${oldUser.email}) atualizado. Alteracoes: ${Object.keys(updates).join(', ')}.${actionMeta.reason ? ` Motivo: ${actionMeta.reason}` : ''}`,
          performedBy: actionMeta.performedBy || 'Sistema/Usuario',
          changeSet: {
            type: 'UPDATE_USER',
            before: previousUser,
            after: updatedUser
          }
        });

        set(state => ({
          schools: state.schools.map(s =>
            s.id === schoolId
              ? {
                  ...s,
                  users: s.users.map(u => (u.id === userId ? updatedUser : u))
                }
              : s
          )
        }));
      },

      removeUser: (schoolId, userId, meta) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const userToRemove = school?.users.find(u => u.id === userId);
        if (!school || !userToRemove) return;

        const actionMeta: ActionMeta = meta ?? { performedBy: 'Sistema/Usuario' };

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: 'REMOVE_USER',
          details: `Usuario ${userToRemove.name} (${userToRemove.email}) removido. Licenca liberada.${actionMeta.reason ? ` Motivo: ${actionMeta.reason}` : ''}`,
          performedBy: actionMeta.performedBy || 'Sistema/Usuario',
          changeSet: {
            type: 'REMOVE_USER',
            user: userToRemove
          }
        });

        set(state => ({
          schools: state.schools.map(s =>
            s.id === schoolId
              ? {
                  ...s,
                  users: s.users.filter(user => user.id !== userId),
                  usedLicenses: Math.max(0, s.usedLicenses - 1)
                }
              : s
          )
        }));
      },

      swapUser: (schoolId, oldUserId, newUser, justificationData) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        const oldUser = school?.users.find(u => u.id === oldUserId);
        
	        if (!school || !oldUser) return;
	
        const updatedUserData = {
          ...oldUser,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isCompliant: state.isEmailValid(newUser.email)
        };

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
          details: `Licen�a transferida de ${oldUser.name} (${oldUser.email}) para ${newUser.name} (${newUser.email}). Motivo: ${justificationData.reason}.`,
          performedBy: justificationData.performedBy,
          changeSet: {
            type: 'TRANSFER_LICENSE',
            before: oldUser,
            after: updatedUserData
          }
        });
	
	        set(state => ({
	          schools: state.schools.map(s => 
	            s.id === schoolId 
	              ? { 
	                  ...s, 
                  users: s.users.map(u => 
                    u.id === oldUserId 
                      ? updatedUserData
                      : u
                  ),
	                  hasRecentJustifications: true
	                }
	              : s
	          ),
          justifications: [...state.justifications, justification]
        }));
      },

      transferUsersBetweenSchools: (
        sourceSchoolId,
        sourceUserId,
        targetSchoolId,
        targetUserId,
        justificationData
      ) => {
        const state = get();
        const sourceSchool = state.schools.find(s => s.id === sourceSchoolId);
        const targetSchool = state.schools.find(s => s.id === targetSchoolId);
        if (!sourceSchool || !targetSchool) {
          return;
        }

        const sourceUser = sourceSchool.users.find(u => u.id === sourceUserId);
        const targetUser = targetSchool.users.find(u => u.id === targetUserId);
        if (!sourceUser || !targetUser) {
          return;
        }

        const swappedSourceUsers = sourceSchool.users.map(user =>
          user.id === sourceUserId ? { ...targetUser } : user
        );

        const swappedTargetUsers = targetSchool.users.map(user =>
          user.id === targetUserId ? { ...sourceUser } : user
        );

        const justificationSource: Justification = {
          ...justificationData,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          schoolId: sourceSchool.id,
          schoolName: sourceSchool.name,
          oldUser: {
            name: sourceUser.name,
            email: sourceUser.email,
            role: sourceUser.role,
          },
          newUser: {
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          },
        };

        const justificationTarget: Justification = {
          ...justificationData,
          id: (Date.now() + 1).toString(),
          timestamp: new Date().toISOString(),
          schoolId: targetSchool.id,
          schoolName: targetSchool.name,
          oldUser: {
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          },
          newUser: {
            name: sourceUser.name,
            email: sourceUser.email,
            role: sourceUser.role,
          },
        };

        set(state => ({
          schools: state.schools.map(s => {
            if (s.id === sourceSchoolId) {
              return {
                ...s,
                users: swappedSourceUsers,
                hasRecentJustifications: true,
              };
            }
            if (s.id === targetSchoolId) {
              return {
                ...s,
                users: swappedTargetUsers,
                hasRecentJustifications: true,
              };
            }
            return s;
          }),
          justifications: [...state.justifications, justificationSource, justificationTarget],
        }));

        const commonReason = justificationData.reason;
        state.addHistoryEntry({
          schoolId: sourceSchool.id,
          schoolName: sourceSchool.name,
          action: 'TRANSFER_LICENSE',
          details: `Licença trocada com ${targetUser.name} (${targetSchool.name}). Motivo: ${commonReason}`,
          performedBy: justificationData.performedBy,
          changeSet: {
            type: 'TRANSFER_LICENSE',
            before: sourceUser,
            after: { ...targetUser },
          },
        });

        state.addHistoryEntry({
          schoolId: targetSchool.id,
          schoolName: targetSchool.name,
          action: 'TRANSFER_LICENSE',
          details: `Licença trocada com ${sourceUser.name} (${sourceSchool.name}). Motivo: ${commonReason}`,
          performedBy: justificationData.performedBy,
          changeSet: {
            type: 'TRANSFER_LICENSE',
            before: targetUser,
            after: { ...sourceUser },
          },
        });
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
          timestamp: new Date().toISOString(),
          reverted: false
        }]
      })),

      getHistoryBySchool: (schoolId) => {
        return get().history
          .filter(h => h.schoolId === schoolId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      revertHistoryEntry: (historyId, meta) => {
        const state = get();
        const entry = state.history.find(h => h.id === historyId);
        if (!entry || entry.reverted || !entry.changeSet) {
          return false;
        }

        const targetSchool = state.schools.find(s => s.id === entry.schoolId);
        if (!targetSchool) {
          return false;
        }

        const { changeSet } = entry;
        let updatedSchools: School[] | null = null;
        let revertHistoryAction: HistoryAction = entry.action;
        let revertChangeSet: HistoryChangeSet | null = null;

        const markAsReverted = () =>
          state.history.map(h =>
            h.id === historyId
              ? {
                  ...h,
                  reverted: true,
                  revertReason: meta.reason,
                  revertedBy: meta.performedBy,
                  revertTimestamp: new Date().toISOString()
                }
              : h
          );

        switch (changeSet.type) {
          case 'GRANT_LICENSE': {
            const user = changeSet.user;
            if (!targetSchool.users.some(u => u.id === user.id)) {
              return false;
            }
            updatedSchools = state.schools.map(s =>
              s.id === entry.schoolId
                ? {
                    ...s,
                    users: s.users.filter(u => u.id !== user.id),
                    usedLicenses: Math.max(0, s.usedLicenses - 1)
                  }
                : s
            );
            revertHistoryAction = 'REMOVE_USER';
            revertChangeSet = { type: 'REMOVE_USER', user };
            break;
          }
          case 'REMOVE_USER': {
            const user = changeSet.user;
            if (targetSchool.users.some(u => u.id === user.id)) {
              return false;
            }
            updatedSchools = state.schools.map(s =>
              s.id === entry.schoolId
                ? {
                    ...s,
                    users: [...s.users, user],
                    usedLicenses: s.usedLicenses + 1
                  }
                : s
            );
            revertHistoryAction = 'GRANT_LICENSE';
            revertChangeSet = { type: 'GRANT_LICENSE', user };
            break;
          }
          case 'UPDATE_USER':
          case 'TRANSFER_LICENSE': {
            const previous = changeSet.before;
            if (!previous) {
              return false;
            }
            if (!targetSchool.users.some(u => u.id === previous.id)) {
              return false;
            }
            updatedSchools = state.schools.map(s =>
              s.id === entry.schoolId
                ? {
                    ...s,
                    users: s.users.map(u => (u.id === previous.id ? previous : u))
                  }
                : s
            );
            revertHistoryAction = changeSet.type;
            revertChangeSet = {
              type: changeSet.type,
              before: changeSet.after ?? changeSet.before,
              after: changeSet.before
            } as HistoryChangeSet;
            break;
          }
          default:
            return false;
        }

        if (!updatedSchools) {
          return false;
        }

        set({
          schools: updatedSchools,
          history: markAsReverted()
        });

        if (revertChangeSet) {
          state.addHistoryEntry({
            schoolId: entry.schoolId,
            schoolName: entry.schoolName,
            action: revertHistoryAction,
            details: `Reversão da ação ${entry.action} executada originalmente em ${new Date(entry.timestamp).toLocaleString('pt-BR')}. Motivo: ${meta.reason}`,
            performedBy: meta.performedBy,
            changeSet: revertChangeSet
          });
        }

        return true;
      },

      setUsageData: (data) => set({ usageData: data }),

      isEmailValid: (email) => {
        return isEmailCompliant(email);
      },

      getLicenseStatus: (school) => {
        const limit = getLicenseLimitForSchool(school.totalLicenses);
        if (school.usedLicenses > limit) return 'Excedido';
        if (school.usedLicenses === limit) return 'Completo';
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

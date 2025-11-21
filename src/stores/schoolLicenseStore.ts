import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { School, Justification, SchoolUser, CanvaUsageData, HistoryEntry, HistoryAction, HistoryChangeSet } from '@/types/schoolLicense';
import { getLicenseLimitForSchool, MAX_LICENSES_PER_SCHOOL } from '@/config/licenseLimits';
import {
  processSchoolsWithUsers,
  generateCanvaOverview,
  isEmailCompliant,
  parseOfficialSchoolsCSV,
  buildFallbackData // Importar a função refatorada
} from '@/lib/officialDataProcessor';
import {
  calculateLicenseStatus,
  isEmailValid
} from '@/lib/utils/schoolUtils';
import {
  buildOverviewFromIntegration,
  buildProcessedSchoolsFromIntegration,
  fetchIntegratedCanvaData
} from '@/lib/integratedCanvaService';
import { ProcessedSchoolData, CanvaOverviewData } from '@/types/officialData';
import type { OfficialSchool, OfficialUser } from '@/types/officialData';
import { loadFranchisingSchools, loadLicenseUsers } from '@/lib/safDataService';

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
          
          const hasPrimaryData =
            processedData &&
            processedData.length > 0 &&
            overview &&
            overview.totalUsers > 0;

          if (hasPrimaryData) {
            finalizeData(processedData, overview);
            return;
          }

          // Fallback data
          const fallbackData = await buildFallbackData();
          if (fallbackData) {
            finalizeData(fallbackData.processedData, fallbackData.overview);
          } else {
            set({ loading: false });
          }
        } catch (error) {
          console.error('Failed to load official data:', error);
          set({ loading: false });
        }
      },

      setSchools: (schools) => set({ schools }),
      addSchool: (school) => {
        const newSchool: School = {
          ...school,
          id: Date.now().toString(),
          usedLicenses: 0,
          users: [],
          hasRecentJustifications: false,
        };
        set(state => ({ schools: [...state.schools, newSchool] }));
      },
      updateSchool: (id, updates) => {
        set(state => ({
          schools: state.schools.map(s =>
            s.id === id ? { ...s, ...updates } : s
          )
        }));
      },

      addUser: (schoolId, user, meta) => {
        const state = get();
        const school = state.schools.find(s => s.id === schoolId);
        if (!school) return false;

        const newUser: SchoolUser = {
          ...user,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isCompliant: isEmailValid(user.email)
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
          isCompliant: updates.email ? isEmailValid(updates.email) : oldUser.isCompliant
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
          isCompliant: isEmailValid(newUser.email)
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
          details: `Licenca transferida de ${oldUser.name} (${oldUser.email}) para ${newUser.name} (${newUser.email}). Motivo: ${justificationData.reason}.`,
          performedBy: justificationData.performedBy,
          changeSet: {
            type: 'TRANSFER_LICENSE',
            before: oldUser,
            after: updatedUserData
          }
        });

          // 2. Adicionar justificativa
          state.addJustification(justification);

          // 3. Atualizar o usuário na store
          set(state => ({
            schools: state.schools.map(s =>
              s.id === schoolId
                ? {
                    ...s,
                    users: s.users.map(u => (u.id === oldUserId ? updatedUserData : u))
                  }
                : s
            )
          }));
      },

      transferUsersBetweenSchools: (
        sourceSchoolId,
        sourceUserId,
        targetSchoolId,
        targetUserId,
        justification
      ) => {
        const state = get();
        const sourceSchool = state.schools.find(s => s.id === sourceSchoolId);
        const targetSchool = state.schools.find(s => s.id === targetSchoolId);
        const sourceUser = sourceSchool?.users.find(u => u.id === sourceUserId);
        const targetUser = targetSchool?.users.find(u => u.id === targetUserId);

        if (!sourceSchool || !targetSchool || !sourceUser || !targetUser) return;

        // 1. Adicionar entrada de histórico
        state.addHistoryEntry({
          schoolId: sourceSchool.id,
          schoolName: sourceSchool.name,
          action: 'TRANSFER_USER_BETWEEN_SCHOOLS',
          details: `Troca de usuários entre escolas: ${sourceUser.name} (${sourceSchool.name}) e ${targetUser.name} (${targetSchool.name}). Motivo: ${justification.reason}.`,
          performedBy: justification.performedBy,
          changeSet: {
            type: 'SWAP_USERS',
            sourceUser: sourceUser,
            targetUser: targetUser,
            sourceSchool: sourceSchool.name,
            targetSchool: targetSchool.name
          }
        });

        // 2. Adicionar justificativa
        state.addJustification({
          ...justification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          oldUser: {
            name: sourceUser.name,
            email: sourceUser.email,
            role: sourceUser.role,
          },
          newUser: {
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
          }
        });

        // 3. Atualizar as escolas
        set(state => ({
          schools: state.schools.map(s => {
            if (s.id === sourceSchoolId) {
              // Remove sourceUser e adiciona targetUser na escola de origem
              return {
                ...s,
                users: [...s.users.filter(u => u.id !== sourceUserId), { ...targetUser, isCompliant: isEmailValid(targetUser.email) }],
              };
            }
            if (s.id === targetSchoolId) {
              // Remove targetUser e adiciona sourceUser na escola de destino
              return {
                ...s,
                users: [...s.users.filter(u => u.id !== targetUserId), { ...sourceUser, isCompliant: isEmailValid(sourceUser.email) }],
              };
            }
            return s;
          })
        }));
      },

      addJustification: (justification) => {
        const newJustification: Justification = {
          ...justification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set(state => ({ justifications: [...state.justifications, newJustification] }));
      },
      getJustificationsBySchool: (schoolId) => {
        return get().justifications.filter(j => j.oldUser.schoolId === schoolId || j.newUser.schoolId === schoolId);
      },

      addHistoryEntry: (entry) => {
        const newEntry: HistoryEntry = {
          ...entry,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          reverted: false,
        };
        set(state => ({ history: [newEntry, ...state.history] }));
      },
      getHistoryBySchool: (schoolId) => {
        return get().history.filter(h => h.schoolId === schoolId);
      },
      revertHistoryEntry: (historyId, meta) => {
        const state = get();
        const entry = state.history.find(h => h.id === historyId);
        if (!entry || entry.reverted) return false;

        // Lógica de reversão (simplificada para o exemplo)
        // A lógica real de reversão deve ser implementada aqui
        // Ex: se a ação foi ADD_USER, a reversão deve ser REMOVE_USER

        set(state => ({
          history: state.history.map(h => h.id === historyId ? { ...h, reverted: true } : h)
        }));

        state.addHistoryEntry({
          schoolId: entry.schoolId,
          schoolName: entry.schoolName,
          action: 'REVERT_ACTION',
          details: `Reversão da ação ${entry.action} (ID: ${historyId}). Motivo: ${meta.reason}.`,
          performedBy: meta.performedBy,
          changeSet: {
            type: 'REVERT_ACTION',
            originalAction: entry.action,
            originalEntryId: historyId
          }
        });

        return true;
      },

      setUsageData: (data) => set({ usageData: data }),

      // Helpers
      getLicenseStatus: (school: School) => {
        const totalLicenses = school.totalLicenses || getLicenseLimitForSchool(school.id);
        return calculateLicenseStatus(school.usedLicenses, totalLicenses);
      },
      getNonMapleBearCount: () => {
        return get().officialData.reduce((acc, data) => acc + data.nonCompliantUsers, 0);
      },
      getDomainCounts: () => {
        const officialData = get().officialData;
        if (!officialData || officialData.length === 0) return [];

        const allUsers = officialData.flatMap(data => data.users);
        const nonCompliantUsers = allUsers.filter(user => !isEmailCompliant(user.email));

        const nonMapleBearDomains = new Map<string, number>();
        nonCompliantUsers.forEach((user) => {
          const domain = user.email.split('@')[1]?.toLowerCase();
          if (domain) {
            nonMapleBearDomains.set(domain, (nonMapleBearDomains.get(domain) || 0) + 1);
          }
        });

        return Array.from(nonMapleBearDomains.entries())
          .map(([domain, count]) => ({ domain, count }))
          .sort((a, b) => b.count - a.count);
      },
    }),
    {
      name: 'school-license-storage',
      version: 1,
    }
  )
);

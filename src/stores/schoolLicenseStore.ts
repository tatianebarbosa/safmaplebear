import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  School,
  Justification,
  SchoolUser,
  CanvaUsageData,
  HistoryEntry,
  HistoryAction,
  HistoryChangeSet,
  LicenseStatus,
} from "@/types/schoolLicense";
import { ProcessedSchoolData, CanvaOverviewData } from "@/types/officialData";
import type { OfficialSchool, OfficialUser } from "@/types/officialData";
import {
  getLicenseLimitForSchool,
  getMaxLicensesPerSchool,
  subscribeToLicenseLimit,
} from "@/config/licenseLimits";
import {
  processSchoolsWithUsers,
  parseOfficialSchoolsCSV,
  buildFallbackData, // Importar a fun???o refatorada
  isEmailCompliant,
} from "@/lib/officialDataProcessor";
import {
  isEmailCompliant as isEmailCompliantSaf,
  loadFranchisingSchools,
  loadLicenseUsers,
} from "@/lib/safDataService";
import {
  buildProcessedSchoolsFromIntegration,
  fetchIntegratedCanvaData,
  buildOverviewFromIntegration,
} from "@/lib/integratedCanvaService";
import { saveLicenseAction, type LicenseAction } from "@/lib/canvaDataProcessor";

const calculateLicenseStatus = (
  usedLicenses: number,
  totalLicenses: number
): "Disponível" | "Completo" | "Excedido" => {
  if (usedLicenses > totalLicenses) {
    return "Excedido";
  }
  if (usedLicenses === totalLicenses) {
    return "Completo";
  }
  return "Disponível";
};

const resolveUserCreatedAt = (user: OfficialUser): string => {
  // Preferir o timestamp oficial (CSV/API); esconder quando nao houver dado real.
  return user.updatedAt || "";
};

type AddUserMeta = {
  origemSolicitacao: "Ticket SAF" | "E-mail" | "Ativo";
  solicitadoPorNome: string;
  solicitadoPorEmail: string;
  observacao: string;
  performedBy?: string;
  ticketNumber?: string;
  emailTitle?: string;
  assetId?: string;
  assetName?: string;
};

type ActionMeta = {
  performedBy?: string;
  reason?: string;
};

interface SchoolLicenseState {
  schools: School[];
  justifications: Justification[];
  history: HistoryEntry[]; // Novo estado para o histÃ³rico de alteraÃ§Ãµes
  usageData: CanvaUsageData[];
  officialData: ProcessedSchoolData[];
  overviewData: CanvaOverviewData | null;
  loading: boolean;

  // Actions
  loadOfficialData: () => Promise<void>;
  setSchools: (schools: School[]) => void;
  addSchool: (school: Omit<School, "id">) => void;
  updateSchool: (id: string, updates: Partial<School>) => void;

  addUser: (
    schoolId: string,
    user: Omit<SchoolUser, "id" | "createdAt">,
    meta: AddUserMeta
  ) => string | null;
  updateUser: (
    schoolId: string,
    userId: string,
    updates: Partial<SchoolUser>,
    meta?: ActionMeta
  ) => void;
  removeUser: (schoolId: string, userId: string, meta?: ActionMeta) => void;

  swapUser: (
    schoolId: string,
    oldUserId: string,
    newUser: Omit<SchoolUser, "id" | "createdAt">,
    justification: Omit<Justification, "id" | "timestamp">
  ) => void;
  transferUsersBetweenSchools: (
    sourceSchoolId: string,
    sourceUserId: string,
    targetSchoolId: string,
    targetUserId: string,
    justification: Pick<Justification, "reason" | "performedBy">
  ) => void;

  addJustification: (
    justification: Omit<Justification, "id" | "timestamp">
  ) => void;
  getJustificationsBySchool: (schoolId: string) => Justification[];

  addHistoryEntry: (
    entry: Omit<HistoryEntry, "id" | "timestamp" | "reverted">
  ) => void; // Nova aÃ§Ã£o para adicionar entrada de histÃ³rico
  getHistoryBySchool: (schoolId: string) => HistoryEntry[]; // Nova aÃ§Ã£o para obter histÃ³rico
  revertHistoryEntry: (
    historyId: string,
    meta: { reason: string; performedBy: string }
  ) => boolean;

  setUsageData: (data: CanvaUsageData[]) => void;
  applyLicenseLimit: (limit: number) => void;

  // Helpers
  getLicenseStatus: (school: School) => LicenseStatus;
  getNonMapleBearCount: () => number;
  getDomainCounts: () => Array<{ domain: string; count: number }>;
  isEmailValid: (email: string) => boolean;
}

// Dados iniciais vazios - serÃ£o carregados dos dados oficiais

const CENTRAL_DOMAINS = ["mbcentral.com.br", "seb.com.br", "sebsa.com.br"];

const normalizeEmail = (email?: string): string =>
  (email || "").trim().toLowerCase();

const isCentralDomainEmail = (email?: string): boolean => {
  const domain = normalizeEmail(email).split("@")[1] || "";
  return CENTRAL_DOMAINS.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`)
  );
};

const centralSchool: School = {
  id: "0",
  name: "Central",
  status: "Ativa",
  city: "Escritorio Central",
  safManager: "Equipe SAF",
  cluster: "Alerta" as any,
  contactEmail: "saf@mbcentral.com.br",
  totalLicenses: 20,
  usedLicenses: 8,
  users: [
    {
      id: "central-1",
      name: "Equipe SAF",
      email: "saf@mbcentral.com.br",
      role: "Administrador" as any,
      isCompliant: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "central-2",
      name: "Operador Canva",
      email: "operador.canva@mbcentral.com.br",
      role: "Professor" as any,
      isCompliant: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "central-3",
      name: "Marketing SAF",
      email: "marketing@mbcentral.com.br",
      role: "Administrador" as any,
      isCompliant: true,
      createdAt: new Date().toISOString(),
    },
  ],
  hasRecentJustifications: false,
};

const ensureCentralSchool = (schools: School[]): School[] => {
  const findCentralIndex = schools.findIndex((school) => {
    const normalizedName = school.name?.toLowerCase() ?? "";
    return school.id === centralSchool.id || normalizedName.includes("central");
  });

  const updated = [...schools];
  let centralIndex = findCentralIndex;

  if (centralIndex >= 0) {
    const existing = updated[findCentralIndex];
    updated[findCentralIndex] = {
      ...centralSchool,
      ...existing,
      id: centralSchool.id,
      name: centralSchool.name,
    };
  } else {
    updated.unshift(centralSchool);
    centralIndex = 0;
  }

  const collectedForCentral: SchoolUser[] = [];

  const cleanedSchools = updated.map((school, index) => {
    if (index === centralIndex) {
      return school;
    }

    const remainingUsers: SchoolUser[] = [];
    school.users?.forEach((user) => {
      if (isCentralDomainEmail(user.email)) {
        collectedForCentral.push(user);
      } else {
        remainingUsers.push(user);
      }
    });

    const nextTotal =
      school.id === "no-school"
        ? remainingUsers.length
        : school.totalLicenses;

    return {
      ...school,
      users: remainingUsers,
      usedLicenses: remainingUsers.length,
      totalLicenses: Math.max(nextTotal ?? 0, remainingUsers.length),
    };
  });

  const central = cleanedSchools[centralIndex];
  const mergedCentralUsers = [...(central.users || [])];
  const seen = new Set(mergedCentralUsers.map((user) => normalizeEmail(user.email)));

  collectedForCentral.forEach((user) => {
    const key = normalizeEmail(user.email);
    if (!seen.has(key)) {
      seen.add(key);
      mergedCentralUsers.push(user);
    }
  });

  cleanedSchools[centralIndex] = {
    ...central,
    id: centralSchool.id,
    name: centralSchool.name,
    users: mergedCentralUsers,
    usedLicenses: mergedCentralUsers.length,
    totalLicenses: Math.max(central.totalLicenses ?? mergedCentralUsers.length, mergedCentralUsers.length),
  };

  return cleanedSchools;
};

const seedSchools: School[] = [centralSchool];

const recordLicenseAction = (
  action: Omit<LicenseAction, "id" | "timestamp">
) => {
  if (typeof window === "undefined") return;
  try {
    saveLicenseAction({
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "[schoolLicenseStore] Falha ao registrar historico de licencas",
      error
    );
  }
};

export const useSchoolLicenseStore = create<SchoolLicenseState>()(
  persist(
    (set, get) => {
      const syncLicenseLimit = (limit: number) => {
        const safeLimit = Math.max(1, Math.floor(limit));
        set((state) => {
          const currentSchools = state?.schools?.length ? state.schools : seedSchools;
          let changed = false;
          const updated = currentSchools.map((school) => {
            if (school.id === centralSchool.id) return school;
            if (school.id === "no-school") {
              const newTotal = Math.max(safeLimit, school.users.length);
              if (school.totalLicenses === newTotal) return school;
              changed = true;
              return { ...school, totalLicenses: newTotal };
            }
            if (school.totalLicenses === safeLimit) return school;
            changed = true;
            return { ...school, totalLicenses: safeLimit };
          });
          return changed ? { schools: updated } : state;
        });
      };

      // Reage a mudanças externas no limite (localStorage/env) e aplica ao iniciar
      subscribeToLicenseLimit(() => syncLicenseLimit(getMaxLicensesPerSchool()));
      syncLicenseLimit(getMaxLicensesPerSchool());

      return {
      schools: seedSchools,
      justifications: [],
      history: [], // InicializaÃ§Ã£o do novo estado
      usageData: [],
      officialData: [],
      overviewData: null,
      loading: false,

      loadOfficialData: async () => {
        set({ loading: true });
        try {
          const finalizeData = (
            processedData: ProcessedSchoolData[],
            overview: CanvaOverviewData
          ) => {
            const licenseLimit = getMaxLicensesPerSchool();
            const convertedSchools: School[] = processedData.map((data) => ({
              id: data.school.id,
              name: data.school.name,
              status: data.school.status,
              city: data.school.city,
              safManager: data.school.safManager,
              cluster: data.school.cluster as any,
              contactEmail: data.school.email?.toLowerCase(),
              totalLicenses:
                data.school.id === "no-school"
                  ? Math.max(data.estimatedLicenses, 1)
                  : licenseLimit,
              usedLicenses: data.totalUsers,
              users: data.users.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as any,
                isCompliant: user.isCompliant,
                createdAt: resolveUserCreatedAt(user),
              })),
              hasRecentJustifications: false,
            }));

            set({
              officialData: processedData,
              overviewData: overview,
              schools: ensureCentralSchool(convertedSchools),
              loading: false,
            });
            // Garante que o limite global seja aplicado aos dados carregados
            syncLicenseLimit(licenseLimit);
          };

          // 1) Tentar carregar dados integrados do backend (/api/canva/dados-recentes)
          const integratedData = await fetchIntegratedCanvaData();
          if (integratedData) {
            const officialSchools = await parseOfficialSchoolsCSV();
            const processedFromIntegration = buildProcessedSchoolsFromIntegration(
              integratedData,
              officialSchools
            );
            const overviewFromIntegration = buildOverviewFromIntegration(
              integratedData,
              officialSchools,
              processedFromIntegration
            );
            finalizeData(processedFromIntegration, overviewFromIntegration);
            return;
          }

          // 2) Fallback local (CSVs públicos)
          const fallbackData = await buildFallbackData();
          if (fallbackData) {
            finalizeData(fallbackData.processedData, fallbackData.overview);
            return;
          }

          set({ loading: false });
        } catch (error) {
          console.error("Failed to load official data:", error);
          // Tentar fallback em caso de erro inesperado
          try {
            const fallbackData = await buildFallbackData();
            if (fallbackData) {
              const licenseLimit = getMaxLicensesPerSchool();
              const convertedSchools: School[] = fallbackData.processedData.map(
                (data) => ({
                  id: data.school.id,
              name: data.school.name,
              status: data.school.status,
              city: data.school.city,
              safManager: data.school.safManager,
              cluster: data.school.cluster as any,
              contactEmail: data.school.email?.toLowerCase(),
                  totalLicenses:
                    data.school.id === "no-school"
                      ? Math.max(data.estimatedLicenses, 1)
                      : licenseLimit,
                  usedLicenses: data.totalUsers,
                  users: data.users.map((user) => ({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role as any,
                    isCompliant: user.isCompliant,
                    createdAt: resolveUserCreatedAt(user),
                  })),
                  hasRecentJustifications: false,
                })
              );
              set({
                officialData: fallbackData.processedData,
                overviewData: fallbackData.overview,
                schools: ensureCentralSchool(convertedSchools),
                loading: false,
              });
            } else {
              set({ loading: false });
            }
          } catch (fallbackError) {
            console.error("Fallback data also failed:", fallbackError);
            set({ loading: false });
          }
        }
      },

      setSchools: (schools) => set({ schools: ensureCentralSchool(schools) }),
      addSchool: (school) => {
        const newSchool: School = {
          ...school,
          id: Date.now().toString(),
          usedLicenses: 0,
          users: [],
          hasRecentJustifications: false,
        };
        set((state) => ({ schools: [...state.schools, newSchool] }));
      },
      updateSchool: (id, updates) => {
        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      addUser: (schoolId, user, meta) => {
        const state = get();
        const school = state.schools.find((s) => s.id === schoolId);
        if (!school) return null;

        const newUser: SchoolUser = {
          ...user,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          isCompliant: isEmailCompliantSaf(user.email),
        };

        const originDetails =
          meta.origemSolicitacao === "Ativo"
            ? `Origem: ${meta.origemSolicitacao}${meta.assetName ? ` (${meta.assetName})` : ""}.`
            : `Origem: ${meta.origemSolicitacao}.`;

        const justificationParts: string[] = [];
        if (meta.origemSolicitacao === "Ticket SAF" && meta.ticketNumber?.trim()) {
          justificationParts.push(`Ticket: ${meta.ticketNumber}`);
        }
        if (meta.origemSolicitacao === "E-mail" && meta.emailTitle?.trim()) {
          justificationParts.push(`Email: ${meta.emailTitle}`);
        }
        if (meta.origemSolicitacao === "Ativo" && (meta.assetName || meta.assetId)) {
          justificationParts.push(`Ativo: ${meta.assetName || meta.assetId}`);
        }
        if (meta.observacao?.trim()) {
          justificationParts.push(`Obs: ${meta.observacao.trim()}`);
        }

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: "ADD_USER",
          details: `Novo usuario adicionado: ${user.name} (${user.email}). ${originDetails} Solicitado por: ${meta.solicitadoPorNome} (${meta.solicitadoPorEmail}). Motivo: ${meta.observacao}.`,
          performedBy: meta.performedBy || "Sistema/Usuario",
          changeSet: {
            type: "ADD_USER",
            user: newUser,
          },
        });

        const justificationText =
          justificationParts.join(" | ") || "Justificativa nao informada";

        recordLicenseAction({
          schoolId: school.id,
          schoolName: school.name,
          action: "add",
          userId: newUser.id,
          userName: newUser.name,
          userEmail: newUser.email,
          justification: justificationText,
          performedBy: meta.performedBy || "Sistema/Usuario",
        });

        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  users: [...s.users, newUser],
                  usedLicenses: s.users.length + 1,
                }
              : s
          ),
        }));

        return newUser.id;
      },

      updateUser: (schoolId, userId, updates, meta) => {
        const state = get();
        const school = state.schools.find((s) => s.id === schoolId);
        const oldUser = school?.users.find((u) => u.id === userId);
        if (!school || !oldUser) return;

        const actionMeta: ActionMeta = meta ?? {
          performedBy: "Sistema/Usuario",
        };
        const previousUser = { ...oldUser };
        const updatedUser: SchoolUser = {
          ...oldUser,
          ...updates,
          isCompliant: updates.email
            ? isEmailCompliantSaf(updates.email)
            : isEmailCompliantSaf(oldUser.email),
        };

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: "UPDATE_USER",
          details: `Usuario ${oldUser.name} (${
            oldUser.email
          }) atualizado. Alteracoes: ${Object.keys(updates).join(", ")}.${
            actionMeta.reason ? ` Motivo: ${actionMeta.reason}` : ""
          }`,
          performedBy: actionMeta.performedBy || "Sistema/Usuario",
          changeSet: {
            type: "UPDATE_USER",
            before: previousUser,
            after: updatedUser,
          },
        });

        recordLicenseAction({
          schoolId: school.id,
          schoolName: school.name,
          action: "update",
          userId: updatedUser.id,
          userName: updatedUser.name,
          userEmail: updatedUser.email,
          justification:
            actionMeta.reason?.trim() || "Justificativa nao informada",
          performedBy: actionMeta.performedBy || "Sistema/Usuario",
        });

        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  users: s.users.map((u) =>
                    u.id === userId ? updatedUser : u
                  ),
                }
              : s
          ),
        }));
      },

      removeUser: (schoolId, userId, meta) => {
        const state = get();
        const school = state.schools.find((s) => s.id === schoolId);
        const userToRemove = school?.users.find((u) => u.id === userId);
        if (!school || !userToRemove) return;

        const actionMeta: ActionMeta = meta ?? {
          performedBy: "Sistema/Usuario",
        };

        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: "REMOVE_USER",
          details: `Usuario ${userToRemove.name} (${
            userToRemove.email
          }) removido. Licenca liberada.${
            actionMeta.reason ? ` Motivo: ${actionMeta.reason}` : ""
          }`,
          performedBy: actionMeta.performedBy || "Sistema/Usuario",
          changeSet: {
            type: "REMOVE_USER",
            user: userToRemove,
          },
        });

        recordLicenseAction({
          schoolId: school.id,
          schoolName: school.name,
          action: "delete",
          userId: userToRemove.id,
          userName: userToRemove.name,
          userEmail: userToRemove.email,
          justification:
            actionMeta.reason?.trim() || "Justificativa nao informada",
          performedBy: actionMeta.performedBy || "Sistema/Usuario",
        });

        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  users: s.users.filter((user) => user.id !== userId),
                  usedLicenses: Math.max(0, s.usedLicenses - 1),
                }
              : s
          ),
        }));
      },

      swapUser: (schoolId, oldUserId, newUser, justificationData) => {
        const state = get();
        const school = state.schools.find((s) => s.id === schoolId);
        const oldUser = school?.users.find((u) => u.id === oldUserId);

        if (!school || !oldUser) return;

        const updatedUserData = {
          ...oldUser,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isCompliant: isEmailCompliantSaf(newUser.email),
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
          },
        };

        // 1. Adicionar entrada de histÃ³rico
        state.addHistoryEntry({
          schoolId: school.id,
          schoolName: school.name,
          action: "TRANSFER_LICENSE",
          details: `Licenca transferida de ${oldUser.name} (${oldUser.email}) para ${newUser.name} (${newUser.email}). Motivo: ${justificationData.reason}.`,
          performedBy: justificationData.performedBy || "Sistema/Usuario",
          changeSet: {
            type: "TRANSFER_LICENSE",
            sourceSchool: {
              id: school.id,
              name: school.name,
              beforeUser: oldUser,
              afterUser: updatedUserData,
            },
          },
        });

        // 2. Adicionar justificativa
        state.addJustification(justification);

        recordLicenseAction({
          schoolId: school.id,
          schoolName: school.name,
          action: "transfer",
          userId: oldUser.id,
          userName: updatedUserData.name,
          userEmail: updatedUserData.email,
          justification:
            justificationData.reason?.trim() ||
            "Justificativa nao informada",
          performedBy: justificationData.performedBy || "Sistema/Usuario",
        });

        // 3. Atualizar o usuÃ¡rio na store
        set((state) => ({
          schools: state.schools.map((s) =>
            s.id === schoolId
              ? {
                  ...s,
                  users: s.users.map((u) =>
                    u.id === oldUserId ? updatedUserData : u
                  ),
                }
              : s
          ),
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
        const sourceSchool = state.schools.find((s) => s.id === sourceSchoolId);
        const targetSchool = state.schools.find((s) => s.id === targetSchoolId);
        const sourceUser = sourceSchool?.users.find(
          (u) => u.id === sourceUserId
        );
        const targetUser = targetSchool?.users.find(
          (u) => u.id === targetUserId
        );

        if (!sourceSchool || !targetSchool || !sourceUser || !targetUser)
          return;

        // 1. Adicionar entradas de historico (uma para cada escola) com snapshots completos
        const changeSet = {
          type: "TRANSFER_LICENSE" as const,
          sourceSchool: {
            id: sourceSchool.id,
            name: sourceSchool.name,
            beforeUser: sourceUser,
            afterUser: targetUser,
          },
          targetSchool: {
            id: targetSchool.id,
            name: targetSchool.name,
            beforeUser: targetUser,
            afterUser: sourceUser,
          },
        };

        const transferDetails = `Troca de usuÃ¡rios entre escolas: ${sourceUser.name} (${sourceSchool.name}) e ${targetUser.name} (${targetSchool.name}). Motivo: ${justification.reason}.`;

        state.addHistoryEntry({
          schoolId: sourceSchool.id,
          schoolName: sourceSchool.name,
          action: "TRANSFER_LICENSE",
          details: transferDetails,
          performedBy: justification.performedBy,
          changeSet,
        });
        state.addHistoryEntry({
          schoolId: targetSchool.id,
          schoolName: targetSchool.name,
          action: "TRANSFER_LICENSE",
          details: transferDetails,
          performedBy: justification.performedBy,
          changeSet,
        });

        
// 2. Adicionar justificativa
        state.addJustification({
          ...justification,
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
        });

        recordLicenseAction({
          schoolId: sourceSchool.id,
          schoolName: sourceSchool.name,
          action: "transfer",
          userId: sourceUser.id,
          userName: sourceUser.name,
          userEmail: sourceUser.email,
          targetSchoolId: targetSchool.id,
          targetSchoolName: targetSchool.name,
          justification:
            justification.reason?.trim() || "Justificativa nao informada",
          performedBy: justification.performedBy || "Sistema/Usuario",
        });

        // 3. Atualizar as escolas
        set((state) => ({
          schools: state.schools.map((s) => {
            if (s.id === sourceSchoolId) {
              // Remove sourceUser e adiciona targetUser na escola de origem
              const newUsers = [
                ...s.users.filter((u) => u.id !== sourceUserId),
                { ...targetUser, isCompliant: isEmailCompliantSaf(targetUser.email) },
              ];
              return {
                ...s,
                users: newUsers,
                usedLicenses: newUsers.length, // Recalcula licenÃ§as usadas
              };
            }
            if (s.id === targetSchoolId) {
              // Remove targetUser e adiciona sourceUser na escola de destino
              const newUsers = [
                ...s.users.filter((u) => u.id !== targetUserId),
                { ...sourceUser, isCompliant: isEmailCompliantSaf(sourceUser.email) },
              ];
              return {
                ...s,
                users: newUsers,
                usedLicenses: newUsers.length, // Recalcula licenÃ§as usadas
              };
            }
            return s;
          }),
        }));
      },

      addJustification: (justification) => {
        const newJustification: Justification = {
          ...justification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };
        set((state) => ({
          justifications: [...state.justifications, newJustification],
        }));
      },
      getJustificationsBySchool: (schoolId) => {
        return get().justifications.filter(
          (j) => j.schoolId === schoolId
        );
      },

      addHistoryEntry: (entry) => {
        const newEntry: HistoryEntry = {
          ...entry,
          performedBy: entry.performedBy || "Sistema/Usuario",
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          reverted: false,
        };
        set((state) => ({ history: [newEntry, ...state.history] }));
      },
      getHistoryBySchool: (schoolId) => {
        return get().history.filter((h) => h.schoolId === schoolId);
      },
      revertHistoryEntry: (historyId, meta) => {
        const state = get();
        const entry = state.history.find((h) => h.id === historyId);
        if (!entry || entry.reverted) return false;

        const revertMeta = meta || {
          reason: "Reversao nao informada",
          performedBy: "Sistema/Usuario",
        };
        const cs = entry.changeSet;

        const schools = state.schools.map((s) => {
          let newUsers = [...s.users];
          let usedLicenses = s.usedLicenses;

          const isTransfer = entry.action === "TRANSFER_LICENSE" && cs?.type === "TRANSFER_LICENSE";
          if (!isTransfer && s.id !== entry.schoolId) {
            return s;
          }

          switch (entry.action) {
            case "ADD_USER":
            case "GRANT_LICENSE":
              if (cs && (cs.type === "GRANT_LICENSE" || cs.type === "ADD_USER")) {
                newUsers = newUsers.filter((u) => u.id !== cs.user.id);
                usedLicenses = Math.max(0, usedLicenses - 1);
              }
              break;
            case "REMOVE_USER":
              if (cs?.type === "REMOVE_USER") {
                newUsers = [...newUsers, cs.user];
                usedLicenses += 1;
              }
              break;
            case "UPDATE_USER":
              if (cs?.type === "UPDATE_USER") {
                newUsers = newUsers.map((u) => (u.id === cs.after.id ? cs.before : u));
              }
              break;
            case "TRANSFER_LICENSE": {
              if (!cs || cs.type !== "TRANSFER_LICENSE") return s;

              const isSource = cs.sourceSchool?.id === s.id;
              const isTarget = cs.targetSchool?.id === s.id;
              if (!isSource && !isTarget) return s;

              if (isSource) {
                const { beforeUser, afterUser } = cs.sourceSchool;
                newUsers = newUsers.map((u) => (u.id === afterUser.id ? beforeUser : u));
              }

              if (isTarget && cs.targetSchool) {
                const { beforeUser, afterUser } = cs.targetSchool;
                const hasAfter = newUsers.some((u) => u.id === afterUser.id);
                newUsers = hasAfter
                  ? newUsers.map((u) => (u.id === afterUser.id ? beforeUser : u))
                  : [...newUsers, beforeUser];
              }

              usedLicenses = newUsers.length;
              break;
            }
            default:
              return s;
          }

          return {
            ...s,
            users: newUsers,
            usedLicenses,
          };
        });

        set({ schools });

        set((state) => ({
          history: state.history.map((h) =>
            h.id === historyId
              ? {
                  ...h,
                  reverted: true,
                  revertReason: revertMeta.reason,
                  revertedBy: revertMeta.performedBy,
                  revertTimestamp: new Date().toISOString(),
                }
              : h
          ),
        }));

        return true;
      },

      setUsageData: (data) => set({ usageData: data }),
      applyLicenseLimit: (limit) => {
        syncLicenseLimit(limit);
      },

      // Helpers
      getLicenseStatus: (school: School) => {
        const isCentral =
          school.id === centralSchool.id ||
          (school.name || "").toLowerCase().includes("central");
        if (isCentral) return "Disponível";

        const totalLicenses =
          school.totalLicenses || getLicenseLimitForSchool(school.totalLicenses);
        return calculateLicenseStatus(school.usedLicenses, totalLicenses);
      },
      getNonMapleBearCount: () => {
        const state = get();
        if (state.officialData.length > 0) {
          return state.officialData.reduce(
            (acc, data) => acc + data.nonCompliantUsers,
            0
          );
        }
        if (state.overviewData) {
          return state.overviewData.nonCompliantUsers ?? 0;
        }
        return 0;
      },
      getDomainCounts: () => {
        const state = get();
        const officialData = state.officialData;
        if (!officialData || officialData.length === 0) {
          if (state.overviewData?.topNonCompliantDomains) {
            return state.overviewData.topNonCompliantDomains;
          }
          return [];
        }

        const allUsers = officialData.flatMap((data) => data.users);
        const nonCompliantUsers = allUsers.filter(
          (user) => !isEmailCompliant(user.email)
        );

        const nonMapleBearDomains = new Map<string, number>();
        nonCompliantUsers.forEach((user) => {
          const domain = user.email.split("@")[1]?.toLowerCase();
          if (domain) {
            nonMapleBearDomains.set(
              domain,
              (nonMapleBearDomains.get(domain) || 0) + 1
            );
          }
        });

        return Array.from(nonMapleBearDomains.entries())
          .map(([domain, count]) => ({ domain, count }))
          .sort((a, b) => b.count - a.count);
      },
      isEmailValid: (email: string) => isEmailCompliantSaf(email),
      };
    },
    {
      name: "school-license-storage-v2",
      version: 2,
      onRehydrateStorage: () => (state) => {
        // Reaplica o limite salvo ao hidratar para atualizar totais das escolas persistidas
        if (state?.applyLicenseLimit) {
          const limit = getMaxLicensesPerSchool();
          state.applyLicenseLimit(limit);
        }
      },
    }
  )
);

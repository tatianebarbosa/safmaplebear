import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Role, Agente } from "@/types/tickets";

interface AuthStore {
  currentUser: User | null;
  users: User[];

  // Actions
  setCurrentUser: (user: User | null) => void;
  setUsers: (users: User[]) => void;
  createUser: (userData: Omit<User, "id">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  removeUser: (id: string) => void;

  // Auth helpers
  hasRole: (role: Role) => boolean;
  canManageTicket: (ticketAgente: Agente) => boolean;
  canAddNote: () => boolean;
  isAgent: () => boolean;
  isCoordinator: () => boolean;
  isAdmin: () => boolean;
}

const seedUsers: User[] = [
  { id: "1", name: "Tati", email: "tati@mbcentral.com.br", role: "Agent", agente: "Tati" },
  { id: "2", name: "Rafha", email: "rafha@mbcentral.com.br", role: "Agent", agente: "Rafha" },
  { id: "3", name: "Rafhael", email: "rafhael@mbcentral.com.br", role: "Agent", agente: "Rafhael" },
  { id: "4", name: "Ingrid", email: "ingrid@mbcentral.com.br", role: "Agent", agente: "Ingrid" },
  { id: "5", name: "Joao", email: "joao@mbcentral.com.br", role: "Agent", agente: "Joao" },
  { id: "6", name: "Jaque", email: "jaque@mbcentral.com.br", role: "Agent", agente: "Jaque" },
  { id: "7", name: "Jaqueline", email: "jaqueline@mbcentral.com.br", role: "Agent", agente: "Jaqueline" },
  { id: "8", name: "Jessika", email: "jessika@mbcentral.com.br", role: "Agent", agente: "Jessika" },
  { id: "9", name: "Tatiane", email: "tatiane@mbcentral.com.br", role: "Agent", agente: "Tatiane" },
  { id: "10", name: "Yasmin", email: "yasmin@mbcentral.com.br", role: "Agent", agente: "Yasmin" },
  { id: "11", name: "Fernanda", email: "fernanda@mbcentral.com.br", role: "Agent", agente: "Fernanda" },
  { id: "12", name: "Coordenador", email: "coordenador@mbcentral.com.br", role: "Coordinator" },
  { id: "13", name: "Admin", email: "admin@mbcentral.com.br", role: "Admin" },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: seedUsers.find((u) => u.role === "Admin") || null,
      users: [],

      setCurrentUser: (user) => set({ currentUser: user }),

      setUsers: (users) => set({ users }),

      createUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: Date.now().toString(),
        };

        set((state) => ({
          users: [...state.users, newUser],
        }));
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        }));
      },

      removeUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      hasRole: (role) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        const current = (currentUser.role || "").toLowerCase();
        const target = (role || "").toLowerCase();

        if (current === "admin") return true;
        if (current === "coordinator" && (target === "agent" || target === "coordinator")) return true;

        return current === target;
      },

      canManageTicket: (ticketAgente) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        if (currentUser.role === "Admin" || currentUser.role === "Coordinator") return true;
        return currentUser.role === "Agent" && currentUser.agente === ticketAgente;
      },

      isAgent: () => get().currentUser?.role?.toLowerCase() === "agent",
      isCoordinator: () => get().currentUser?.role?.toLowerCase() === "coordinator",
      isAdmin: () => get().currentUser?.role?.toLowerCase() === "admin",
      canAddNote: () => {
        const role = get().currentUser?.role;
        return role === "Coordinator" || role === "Admin";
      },
    }),
    {
      name: "saf-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.users.length === 0) {
          state.setUsers(seedUsers);
        }
        // Se nenhum usu�rio estiver logado, definimos Admin como padr�o para habilitar gest�o.
        if (!state.currentUser) {
          const admin = state.users.find((u) => u.role === "Admin") || seedUsers.find((u) => u.role === "Admin");
          if (admin) {
            state.setCurrentUser(admin);
          }
        }
      },
    }
  )
);

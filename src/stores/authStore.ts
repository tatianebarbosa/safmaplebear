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

// Initial seed users
const seedUsers: User[] = [
  { id: "1", name: "Tati", email: "tati@mbcentral.com.br", role: "Agent", agente: "Tati" },
  { id: "2", name: "Rafha", email: "rafha@mbcentral.com.br", role: "Agent", agente: "Rafha" },
  { id: "3", name: "Ingrid", email: "ingrid@mbcentral.com.br", role: "Agent", agente: "Ingrid" },
  { id: "4", name: "Joao", email: "joao@mbcentral.com.br", role: "Agent", agente: "Joao" },
  { id: "5", name: "Jaque", email: "jaque@mbcentral.com.br", role: "Agent", agente: "Jaque" },
  { id: "6", name: "Jessika", email: "jessika@mbcentral.com.br", role: "Agent", agente: "Jessika" },
  { id: "7", name: "Fernanda", email: "fernanda@mbcentral.com.br", role: "Agent", agente: "Fernanda" },
  { id: "8", name: "Coordenador", email: "coordenador@mbcentral.com.br", role: "Coordinator" },
  { id: "9", name: "Admin", email: "admin@mbcentral.com.br", role: "Admin" },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
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

        // Admin has all permissions
        if (currentUser.role === "Admin") return true;

        // Coordinator has Agent + Coordinator permissions
        if (currentUser.role === "Coordinator" && (role === "Agent" || role === "Coordinator")) return true;

        return currentUser.role === role;
      },

      canManageTicket: (ticketAgente) => {
        const { currentUser } = get();
        if (!currentUser) return false;

        // Admin and Coordinator can manage any ticket
        if (currentUser.role === "Admin" || currentUser.role === "Coordinator") return true;

        // Agent can only manage their own tickets
        return currentUser.role === "Agent" && currentUser.agente === ticketAgente;
      },

      isAgent: () => get().currentUser?.role === "Agent",
      isCoordinator: () => get().currentUser?.role === "Coordinator",
      isAdmin: () => get().currentUser?.role === "Admin",
      canAddNote: () => {
        const role = get().currentUser?.role;
        return role === "Coordinator" || role === "Admin";
      },
    }),
    {
      name: "saf-auth-storage",
      onRehydrateStorage: () => (state) => {
        // Initialize with seed data if no users exist
        if (state && state.users.length === 0) {
          state.setUsers(seedUsers);
        }
      },
    }
  )
);

// src/components/auth/AuthService.ts
import { clearPersistedAuthState, useAuthStore } from "@/stores/authStore";

export const authService = {
  logout: () => {
    clearPersistedAuthState();
    useAuthStore.getState().setCurrentUser(null);
  },
};

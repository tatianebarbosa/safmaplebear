// src/components/auth/AuthService.ts

export const authService = {
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
  },
};

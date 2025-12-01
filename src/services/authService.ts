// src/services/authService.ts
import { z } from "zod";
import userService from "@/services/userService";

// Credenciais vlidas para modo desenvolvimento
const VALID_CREDENTIALS = [
  { username: "admin", password: "admin2025", role: "admin" },
  { username: "saf@seb.com.br", password: "saf2025", role: "user" },
  { username: "coordenador@sebsa.com.br", password: "coord2025", role: "coord" },
  { username: "tatiane.barbosa", password: "tatiane.barbosa", role: "user" },
];

// Esquema de validao para o login
const loginSchema = z.object({
  username: z.string().min(1, "O nome de usu?rio  obrigatrio"),
  password: z.string().min(1, "A senha  obrigatria"),
});

// Tipagem para os dados de login
export type LoginData = z.infer<typeof loginSchema>;

// Tipagem para a resposta da API de login
interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

/**
 * Autentica o usu?rio (modo desenvolvimento - autenticao local)
 * @param data - Credenciais de login (usu?rio e senha).
 * @returns A resposta da API de login.
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  // Valida os dados de entrada
  loginSchema.parse(data);

  // Simula delay de rede
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Normaliza o username removendo espaos
  const normalizedUsername = data.username.trim().toLowerCase();

  // If an API base url is configured (Vite env var `VITE_API_BASE_URL`), try remote login (useful for mock server)
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (apiBase) {
    try {
      const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body?.message || "Falha ao autenticar no servidor");
      }

      const json = await resp.json();
      // Support both mock format and expected token format
      const token = json.token ?? json.data?.token ?? json.accessToken ?? "";
      const user = json.user ??
        json.data?.user ?? {
          id: data.username,
          username: data.username,
          role: "user",
        };

      if (!token) throw new Error("Token no recebido do servidor");

      return {
        token,
        user: {
          id: user.id ?? user.username ?? data.username,
          username: user.username ?? data.username,
          role: user.role ?? "user",
        },
      };
    } catch (err) {
      // If remote call fails, fall back to local dev auth (below)
      console.warn("Remote auth failed, falling back to local dev auth:", err);
    }
  }

  // Verifica credenciais localmente
  const user =
    VALID_CREDENTIALS.find(
      (cred) =>
        cred.username.toLowerCase() === normalizedUsername &&
        cred.password === data.password
    ) ||
    (() => {
      const devUser = userService.findUserByUsername(normalizedUsername);
      if (!devUser || devUser.password !== data.password) return null;
      return {
        username: devUser.username,
        password: devUser.password,
        role: devUser.role,
      };
    })();

  if (!user) {
    throw new Error("Credenciais inválidas");
  }

  // Gera um token JWT simples
  const token = btoa(
    JSON.stringify({
      id: user.username,
      username: user.username,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
    })
  );

  return {
    token,
    user: {
      id: user.username,
      username: user.username,
      role: user.role,
    },
  };
};

/**
 * Salva o token de autenticao no localStorage.
 * @param token - O token de autenticao.
 */
export const saveAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

/**
 * Obtm o token de autenticao do localStorage.
 * @returns O token de autenticao ou null se no existir.
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

/**
 * Remove o token de autenticao do localStorage.
 */
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

/**
 * Verifica se o usu?rio est autenticado.
 * @returns True se o usu?rio estiver autenticado, false caso contrrio.
 */
export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};

// Save and read current user (development convenience)
export const saveUser = (user: {
  id: string;
  username: string;
  role: string;
}) => {
  try {
    localStorage.setItem("saf_current_user", JSON.stringify(user));
  } catch (e) {
    console.warn("saveUser failed", e);
  }
};

export const getCurrentUser = (): {
  id: string;
  username: string;
  role: string;
} | null => {
  try {
    const raw = localStorage.getItem("saf_current_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const logout = () => {
  removeAuthToken();
  try {
    localStorage.removeItem("saf_current_user");
  } catch (e) {}
};

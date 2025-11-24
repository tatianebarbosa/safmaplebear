// src/services/authService.ts
import { z } from "zod";
import userService from "@/services/userService";

// Credenciais válidas para modo desenvolvimento
const VALID_CREDENTIALS = [
  { username: "admin", password: "admin2025", role: "admin" },
  { username: "saf@seb.com.br", password: "saf2025", role: "user" },
  { username: "coordenador@sebsa.com.br", password: "coord2025", role: "coord" },
];

// Esquema de validação para o login
const loginSchema = z.object({
  username: z.string().min(1, "O nome de usuário é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
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
 * Autentica o usuário (modo desenvolvimento - autenticação local)
 * @param data - Credenciais de login (usuário e senha).
 * @returns A resposta da API de login.
 */
export const login = async (data: LoginData): Promise<LoginResponse> => {
  // Valida os dados de entrada
  loginSchema.parse(data);

  // Simula delay de rede
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Normaliza o username removendo espaços
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

      if (!token) throw new Error("Token não recebido do servidor");

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
 * Salva o token de autenticação no localStorage.
 * @param token - O token de autenticação.
 */
export const saveAuthToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

/**
 * Obtém o token de autenticação do localStorage.
 * @returns O token de autenticação ou null se não existir.
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem("authToken");
};

/**
 * Remove o token de autenticação do localStorage.
 */
export const removeAuthToken = () => {
  localStorage.removeItem("authToken");
};

/**
 * Verifica se o usuário está autenticado.
 * @returns True se o usuário estiver autenticado, false caso contrário.
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

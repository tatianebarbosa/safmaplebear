import { User, Role } from "@/types/tickets";

const AUTH_TOKEN_KEYS = ["authToken", "saf_auth_token"] as const;
const STORAGE_KEYS_TO_CLEAR = [
  "authToken",
  "saf_auth_token",
  "userEmail",
  "saf_current_user",
  "saf-auth-storage",
  "saf_dev_users_v2",
  "saf_dev_audit_v1",
] as const;

export interface AuthTokenPayload {
  exp?: number;
  role?: string;
  sub?: string;
  username?: string;
  email?: string;
  name?: string;
  id?: string;
  [key: string]: unknown;
}

const decodeBase64 = (value: string): string | null => {
  try {
    return atob(value);
  } catch {
    return null;
  }
};

const normalizeTokenPayload = (rawPayload: string): AuthTokenPayload | null => {
  try {
    return JSON.parse(rawPayload) as AuthTokenPayload;
  } catch {
    return null;
  }
};

const decodeJwtPayload = (token: string): AuthTokenPayload | null => {
  if (!token.includes(".")) {
    return normalizeTokenPayload(decodeBase64(token) || "");
  }

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  return normalizeTokenPayload(decodeBase64(padded) || "");
};

const normalizeRole = (role?: string | null): Role | null => {
  const normalized = (role ?? "").trim().toLowerCase();

  if (normalized === "admin") return "Admin";
  if (normalized === "coordinator" || normalized === "coordenador") return "Coordinator";
  if (normalized === "agent" || normalized === "agente" || normalized === "user") return "Agent";

  return null;
};

const isTokenExpired = (payload: AuthTokenPayload): boolean => {
  const { exp } = payload;
  if (typeof exp !== "number") return false;

  const expMillis = exp > 1_000_000_000_000 ? exp : exp * 1000;
  return Date.now() >= expMillis;
};

export const decodeAuthTokenPayload = (token: string | null): AuthTokenPayload | null => {
  if (!token) return null;
  return decodeJwtPayload(token);
};

export const isAuthTokenValid = (token: string | null): boolean => {
  const payload = decodeAuthTokenPayload(token);
  if (!payload) return false;
  if (isTokenExpired(payload)) return false;

  return !!normalizeRole(payload.role);
};

export const validateAuthToken = (token: string | null): boolean => isAuthTokenValid(token);

export const getStoredAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  return AUTH_TOKEN_KEYS.map((key) => localStorage.getItem(key)).find((value) => !!value) ?? null;
};

export const getUserFromTokenPayload = (
  token: string | null
): User | null => {
  if (!token) return null;

  const payload = decodeAuthTokenPayload(token);
  if (!payload || isTokenExpired(payload)) return null;

  const role = normalizeRole(payload.role);
  if (!role) return null;

  const username = String(payload.username || payload.sub || payload.email || "");
  const name = String(payload.name || username || payload.username || "");

  return {
    id: String(payload.id || username || ""),
    name,
    email: String(payload.email || username || ""),
    role,
  };
};

export const getUserFromToken = (
  token: string | null
): User | null => getUserFromTokenPayload(token);

export const getCurrentSessionUser = (): User | null => {
  return getUserFromTokenPayload(getStoredAuthToken());
};

export const clearAuthState = () => {
  if (typeof window === "undefined") return;

  STORAGE_KEYS_TO_CLEAR.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // no-op
    }
  });
};

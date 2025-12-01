import { getAuthToken } from "@/services/authService";

const apiBase =
  typeof import.meta !== "undefined"
    ? ((import.meta.env?.VITE_API_BASE_URL as string | undefined) ?? "")
    : "";
const apiPrefix = apiBase ? apiBase.replace(/\/$/, "") : "";

const buildUrl = () => `${apiPrefix}/api/license_limit`;

const authHeaders = () => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

type LicenseLimitResponse = {
  success: boolean;
  limit?: number;
  default?: number;
  message?: string;
  data?: { updated?: number; limit?: number };
};

export async function fetchLicenseLimit(): Promise<number | null> {
  if (!apiPrefix) return null;

  try {
    const res = await fetch(buildUrl(), { method: "GET", headers: authHeaders() });
    const json = (await res.json().catch(() => ({}))) as LicenseLimitResponse;
    if (!res.ok || json.success === false) {
      return null;
    }
    const limit = json.limit ?? json.data?.limit;
    return typeof limit === "number" && Number.isFinite(limit) ? limit : null;
  } catch {
    return null;
  }
}

export async function saveLicenseLimit(
  newLimit: number,
  motivo: string
): Promise<number> {
  if (!apiPrefix) {
    throw new Error("API base URL no configurada");
  }

  const res = await fetch(buildUrl(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ newLimit, motivo }),
  });

  const json = (await res.json().catch(() => ({}))) as LicenseLimitResponse;
  if (!res.ok || json.success === false) {
    throw new Error(json.message || "Falha ao salvar limite no servidor");
  }

  const limit = json.limit ?? json.data?.limit ?? newLimit;
  return typeof limit === "number" && Number.isFinite(limit) ? limit : newLimit;
}

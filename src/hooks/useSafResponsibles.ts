import { useEffect, useMemo, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getAgentDisplayName } from "@/data/teamMembers";
import { getAuthToken } from "@/services/authService";
import { listUsers as listLocalUsers } from "@/services/userService";
import type { User } from "@/types/tickets";

const FALLBACK_RESPONSIBLES = [
  "Rafael",
  "Joao",
  "João",
  "Ingrid",
  "Rafha",
  "Rafhael",
  "Tatiane",
  "Jaque",
  "Jaqueline",
  "Jessika",
  "Yasmin",
  "Fernanda",
];

type Option = { value: string; label: string; display: string };

type UseSafResponsiblesOptions = {
  includeAllRoles?: boolean;
  includeAdmins?: boolean;
};

export const useSafResponsibles = (opts: UseSafResponsiblesOptions = {}): Option[] => {
  const { includeAllRoles = true, includeAdmins = false } = opts;
  const { users, setUsers } = useAuthStore();
  const loadedRef = useRef(false);

  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s._-]+/g, "")
      .toLowerCase()
      .trim();

  const hydrateUsers = useCallback(async () => {
    // 0) Tenta carregar direto do estado persistido (atualizado pela página de Admin)
    try {
      const persisted = typeof window !== "undefined" ? localStorage.getItem("saf-auth-storage") : null;
      if (persisted) {
        const parsed = JSON.parse(persisted);
        const storedUsers = parsed?.state?.users;
        if (Array.isArray(storedUsers) && storedUsers.length > 0) {
          setUsers(storedUsers as User[]);
          // Não faz return para permitir refresh da API, mas já garante dados locais atualizados
        }
      }
    } catch {
      /* ignore */
    }

    // Primeiro tenta a API real
    try {
      const token = getAuthToken() || (typeof window !== "undefined" ? localStorage.getItem("saf_auth_token") : null);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const resp = await fetch("/api/admin/users", { headers });
      const data = await resp.json().catch(() => ({}));
      if (resp.ok && data?.success && Array.isArray(data.users)) {
        const mapped: User[] = data.users.map((u: any) => ({
          id: u.username || u.id || u.name,
          name: u.name || u.username || u.id,
          email: u.username || u.email || "",
          role:
            (u.role || "").toLowerCase() === "admin"
              ? "Admin"
              : (u.role || "").toLowerCase().startsWith("coord")
              ? "Coordinator"
              : "Agent",
          agente:
            (u.role || "").toLowerCase() === "admin"
              ? undefined
              : u.agente || u.name || u.username || u.id,
        }));
        setUsers(mapped);
        return;
      }
    } catch (e) {
      // Ignora e tenta fallback local
    }

    // Fallback local (dev) se API falhar
    try {
      const localUsers = listLocalUsers();
      const mapped: User[] = localUsers.map((u: any) => ({
        id: u.id,
        name: u.fullName || u.username,
        email: u.username,
        role:
          u.role === "admin"
            ? "Admin"
            : u.role === "coord"
            ? "Coordinator"
            : "Agent",
        agente: u.role === "admin" ? undefined : u.username,
      }));
      setUsers(mapped);
    } catch {
      /* noop */
    }
  }, [setUsers]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    void hydrateUsers();
  }, [hydrateUsers]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "saf-auth-storage" || event.key === "saf_dev_users_v2") {
        loadedRef.current = false;
        void hydrateUsers();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [hydrateUsers]);

  return useMemo(() => {
    const filteredUsers = includeAllRoles ? users || [] : (users || []).filter((user) => user.role === "Agent");

    const base: Option[] = [];
    const seen = new Set<string>();

    filteredUsers.forEach((user) => {
      const rawValue = user.agente || user.email || user.name || user.id || "";
      const value = rawValue.trim();
      if (!value) return;
      const labelCandidate = (user.name || "").trim() || value;
      const label = getAgentDisplayName(labelCandidate) || labelCandidate;
      const key = normalize(label);
      if (!includeAdmins && key === "admin") return;
    if (seen.has(key)) return;
    seen.add(key);
    base.push({ value, label, display: label });
  });

    const fallback: Option[] = base.length
      ? []
      : FALLBACK_RESPONSIBLES.map((name) => {
          const label = getAgentDisplayName(name) || name;
          // Evita apelidos: usa o nome completo como value e label
          return { value: label, label, display: label };
        });

    const merged = new Map<string, Option>();
    [...base, ...fallback].forEach((item) => {
      const key = normalize(item.label || item.value);
      if (!merged.has(key)) merged.set(key, item);
    });

    return Array.from(merged.values()).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [users, includeAllRoles]);
};

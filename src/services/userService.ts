// Local user management for development: stores users and audit logs in localStorage
// simple id generator to avoid extra dependency in dev
const uuidv4 = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export type Role = "admin" | "coord" | "user";

export interface DevUser {
  id: string;
  username: string;
  password: string; // plain for dev only
  role: Role;
  createdAt: string;
}

const USERS_KEY = "saf_dev_users_v1";
const AUDIT_KEY = "saf_dev_audit_v1";

const defaultUsers: DevUser[] = [
  {
    id: uuidv4(),
    username: "admin",
    password: "admin2025",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    username: "saf@seb.com.br",
    password: "saf2025",
    role: "user",
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    username: "coordenador@sebsa.com.br",
    password: "coord2025",
    role: "coord",
    createdAt: new Date().toISOString(),
  },
];

const migrateLegacyAdminPassword = (
  users: DevUser[]
): { users: DevUser[]; changed: boolean } => {
  let changed = false;
  const migrated = users.map((user) => {
    if (
      user.username.toLowerCase() === "admin" &&
      user.password === "maplebear2025"
    ) {
      changed = true;
      return { ...user, password: "admin2025" };
    }
    return user;
  });

  return { users: migrated, changed };
};

function readUsers(): DevUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) {
      localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }

    const parsed = JSON.parse(raw) as DevUser[];
    const { users: migratedUsers, changed } = migrateLegacyAdminPassword(parsed);
    if (changed) {
      localStorage.setItem(USERS_KEY, JSON.stringify(migratedUsers));
    }
    return migratedUsers;
  } catch (e) {
    console.error("userService: failed to read users", e);
    return defaultUsers;
  }
}

function writeUsers(users: DevUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function listUsers(): DevUser[] {
  return readUsers();
}

// Remote API helpers (async) - will throw if remote call fails
export async function fetchUsersRemote(): Promise<
  Pick<DevUser, "id" | "username" | "role">[]
> {
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (!apiBase) throw new Error("VITE_API_BASE_URL not configured");
  const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/users`);
  if (!resp.ok) throw new Error("Failed to fetch users");
  const json = await resp.json();
  return json.users;
}

export async function createUserRemote(
  username: string,
  password: string,
  role: Role = "user"
) {
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (!apiBase) throw new Error("VITE_API_BASE_URL not configured");
  const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.message || "Failed to create user");
  }
  const json = await resp.json();
  return json.user;
}

export async function deleteUserRemote(id: string) {
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (!apiBase) throw new Error("VITE_API_BASE_URL not configured");
  const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/users/${id}`, {
    method: "DELETE",
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.message || "Failed to delete user");
  }
  return true;
}

export async function changePasswordRemote(id: string, newPassword: string) {
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (!apiBase) throw new Error("VITE_API_BASE_URL not configured");
  const resp = await fetch(
    `${apiBase.replace(/\/$/, "")}/api/users/${id}/password`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    }
  );
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(body.message || "Failed to change password");
  }
  return true;
}

export async function fetchAuditRemote() {
  const apiBase =
    typeof import.meta !== "undefined"
      ? (import.meta.env?.VITE_API_BASE_URL as string | undefined)
      : undefined;
  if (!apiBase) throw new Error("VITE_API_BASE_URL not configured");
  const resp = await fetch(`${apiBase.replace(/\/$/, "")}/api/audit`);
  if (!resp.ok) throw new Error("Failed to fetch audit");
  const json = await resp.json();
  return json.audit as AuditEntry[];
}

export function findUserByUsername(username: string): DevUser | undefined {
  const users = readUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(
  username: string,
  password: string,
  role: Role = "user"
) {
  const users = readUsers();
  if (users.some((u) => u.username.toLowerCase() === username.toLowerCase())) {
    throw new Error("Usuário já existe");
  }
  const user: DevUser = {
    id: uuidv4(),
    username,
    password,
    role,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  logAction({
    actor: "system",
    action: `create_user`,
    detail: `created ${username}`,
  });
  return user;
}

export function deleteUser(id: string) {
  let users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("Usuário não encontrado");
  users = users.filter((u) => u.id !== id);
  writeUsers(users);
  logAction({
    actor: "system",
    action: "delete_user",
    detail: `deleted ${user.username}`,
  });
  return true;
}

export function changePassword(id: string, newPassword: string) {
  const trimmed = newPassword.trim();
  if (trimmed.length < 6) {
    throw new Error("A nova senha deve ter ao menos 6 caracteres.");
  }

  const users = readUsers();
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error("Usuario nao encontrado");
  user.password = trimmed;
  writeUsers(users);
  logAction({
    actor: "system",
    action: "change_password",
    detail: `changed password for ${user.username}`,
  });
  return true;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail?: string;
}

function readAudit(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw) as AuditEntry[];
  } catch (e) {
    console.error("userService: failed to read audit", e);
    return [];
  }
}

function writeAudit(entries: AuditEntry[]) {
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
}

export function logAction(entry: {
  actor: string;
  action: string;
  detail?: string;
}) {
  const audit = readAudit();
  const e: AuditEntry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    actor: entry.actor,
    action: entry.action,
    detail: entry.detail,
  };
  audit.unshift(e);
  writeAudit(audit);
}

export function getAuditEntries(limit = 200): AuditEntry[] {
  return readAudit().slice(0, limit);
}

export default {
  listUsers,
  findUserByUsername,
  createUser,
  deleteUser,
  changePassword,
  logAction,
  getAuditEntries,
};

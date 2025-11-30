import { TEAM_MEMBERS } from "@/data/teamMembers";

// Local user management for development: stores users and audit logs in localStorage
// simple id generator to avoid extra dependency in dev
const uuidv4 = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export type Role = "admin" | "coord" | "user";

type SeedUser = {
  username: string;
  password: string;
  role: Role;
  fullName?: string;
};

export interface DevUser {
  id: string;
  username: string;
  password: string; // plain for dev only
  role: Role;
  createdAt: string;
  fullName?: string;
}

const USERS_KEY = "saf_dev_users_v2";
const AUDIT_KEY = "saf_dev_audit_v1";

const TEAM_SEED_USERS: SeedUser[] = TEAM_MEMBERS.map((member) => ({
  username: member.username,
  password: member.username,
  role: member.role === "coordenadora" ? "coord" : "user",
  fullName: member.fullName,
}));

const CORE_SEED_USERS: SeedUser[] = [
  { username: "admin", password: "admin2025", role: "admin", fullName: "Administrador" },
];

const DEV_SEED_USERS: SeedUser[] = [...CORE_SEED_USERS, ...TEAM_SEED_USERS];
const LEGACY_EMAIL_USERS = ["saf@seb.com.br", "coordenador@sebsa.com.br", "admin@mbcentral.com.br"];

const usernameFullNameMap = TEAM_MEMBERS.reduce<Record<string, string>>((acc, member) => {
  acc[member.username.toLowerCase()] = member.fullName;
  return acc;
}, {});

const buildUserFromSeed = (seed: SeedUser): DevUser => ({
  id: uuidv4(),
  username: seed.username,
  password: seed.password,
  role: seed.role,
  createdAt: new Date().toISOString(),
  fullName: seed.fullName,
});

const defaultUsers: DevUser[] = DEV_SEED_USERS.map(buildUserFromSeed);

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

const ensureSeedUsers = (users: DevUser[]): { users: DevUser[]; changed: boolean } => {
  const existing = new Set(users.map((user) => user.username.toLowerCase()));
  let changed = false;
  const withSeeds = [...users];

  DEV_SEED_USERS.forEach((seed) => {
    if (!existing.has(seed.username.toLowerCase())) {
      withSeeds.push(buildUserFromSeed(seed));
      changed = true;
    }
  });

  return { users: withSeeds, changed };
};

const ensureFullNames = (users: DevUser[]): { users: DevUser[]; changed: boolean } => {
  let changed = false;
  const hydrated = users.map((user) => {
    if (user.fullName) return user;
    const mapped = usernameFullNameMap[user.username.toLowerCase()];
    if (!mapped) return user;
    changed = true;
    return { ...user, fullName: mapped };
  });
  return { users: hydrated, changed };
};

const removeLegacyEmailUsers = (users: DevUser[]): { users: DevUser[]; changed: boolean } => {
  const filtered = users.filter((user) => !LEGACY_EMAIL_USERS.includes(user.username));
  return { users: filtered, changed: filtered.length !== users.length };
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
    const { users: cleanedUsers, changed: removedLegacy } = removeLegacyEmailUsers(migratedUsers);
    const { users: namedUsers, changed: addedNames } = ensureFullNames(cleanedUsers);
    const { users: hydratedUsers, changed: addedSeeds } = ensureSeedUsers(namedUsers);
    if (changed || removedLegacy || addedNames || addedSeeds) {
      localStorage.setItem(USERS_KEY, JSON.stringify(hydratedUsers));
    }
    return hydratedUsers;
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

export function findUserByUsername(username: string): DevUser | undefined {
  const users = readUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function createUser(
  username: string,
  password: string,
  role: Role = "user",
  fullName?: string
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
    fullName: fullName?.trim() || usernameFullNameMap[username.toLowerCase()],
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

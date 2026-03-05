const ENABLE_ONLY_CANVA = import.meta.env.VITE_ENABLE_ONLY_CANVA === "true";
const IS_PRODUCTION = import.meta.env.PROD;

export const isAdminRole = (role?: string | null): boolean =>
  (role ?? "").trim().toLowerCase() === "admin";

export const isCanvaOnlyMode = (role?: string | null): boolean =>
  ENABLE_ONLY_CANVA && !isAdminRole(role);

export const isCoreViewsOnlyMode = (role?: string | null): boolean =>
  IS_PRODUCTION && !isAdminRole(role);

export const isRestrictedToCoreViews = (role?: string | null): boolean =>
  isCanvaOnlyMode(role) || isCoreViewsOnlyMode(role);

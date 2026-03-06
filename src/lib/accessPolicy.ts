// Configuração de ambiente e regras globais de acesso.
const ENABLE_ONLY_CANVA = import.meta.env.VITE_ENABLE_ONLY_CANVA === "true";
const DEPLOY_ENV = (import.meta.env.VITE_DEPLOY_ENV || import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE || "")
  .toLowerCase();
const CORE_VIEW_RESTRICTION = (import.meta.env.VITE_CORE_VIEW_RESTRICTION || "")
  .trim()
  .toLowerCase();

// Indica se é ambiente de teste (staging/qa), onde algumas restrições entram em ação.
const isStagingMode = () =>
  ["staging", "preview", "stg", "qa", "uat", "dev", "development"].includes(
    DEPLOY_ENV,
  );

const isCoreRestrictionEnabled = (): boolean => {
  if (CORE_VIEW_RESTRICTION === "false" || CORE_VIEW_RESTRICTION === "0") {
    return false;
  }

  if (CORE_VIEW_RESTRICTION === "all" || CORE_VIEW_RESTRICTION === "true" || CORE_VIEW_RESTRICTION === "1") {
    return true;
  }

  if (CORE_VIEW_RESTRICTION === "production" || CORE_VIEW_RESTRICTION === "prod") {
    return import.meta.env.PROD;
  }

  if (CORE_VIEW_RESTRICTION === "staging" || CORE_VIEW_RESTRICTION === "preview") {
    return isStagingMode();
  }

  if (CORE_VIEW_RESTRICTION) {
    return import.meta.env.PROD;
  }

  return import.meta.env.PROD;
};

export const isAdminRole = (role?: string | null): boolean =>
  (role ?? "").trim().toLowerCase() === "admin";

export const isCanvaOnlyMode = (role?: string | null): boolean =>
  ENABLE_ONLY_CANVA && !isAdminRole(role);

// Regra mais restritiva: se estiver ativa, o usuário só enxerga as telas principais do Canva.
export const isCoreViewsOnlyMode = (role?: string | null): boolean =>
  isCoreRestrictionEnabled() && !isAdminRole(role);

export const isRestrictedToCoreViews = (role?: string | null): boolean =>
  isCanvaOnlyMode(role) || isCoreViewsOnlyMode(role);

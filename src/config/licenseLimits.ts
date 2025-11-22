export const DEFAULT_MAX_LICENSES = 2;

export const parseEnvLimit = (): number => {
  const envValue = Number(import.meta.env?.VITE_MAX_LICENSES_PER_SCHOOL);
  return Number.isFinite(envValue) && envValue > 0 ? envValue : DEFAULT_MAX_LICENSES;
};

export const getLicenseLimitForSchool = (
  totalLicenses?: number,
  configuredLimit?: number
): number => {
  const baseLimit = Number.isFinite(configuredLimit) && (configuredLimit ?? 0) > 0
    ? Number(configuredLimit)
    : parseEnvLimit();

  if (typeof totalLicenses === 'number' && totalLicenses > 0) {
    return totalLicenses;
  }

  return baseLimit;
};

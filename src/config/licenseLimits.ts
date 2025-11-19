const DEFAULT_MAX_LICENSES = 2;

const parseEnvLimit = (): number => {
  const envValue = Number(import.meta.env?.VITE_MAX_LICENSES_PER_SCHOOL);
  return Number.isFinite(envValue) && envValue > 0 ? envValue : DEFAULT_MAX_LICENSES;
};

export const MAX_LICENSES_PER_SCHOOL = parseEnvLimit();

export const getLicenseLimitForSchool = (totalLicenses?: number): number => {
  if (typeof totalLicenses === 'number' && totalLicenses > 0) {
    return totalLicenses;
  }
  return MAX_LICENSES_PER_SCHOOL;
};

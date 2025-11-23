import { useSyncExternalStore } from "react";

const DEFAULT_MAX_LICENSES = 2;
const STORAGE_KEY = "saf_max_licenses_per_school";

export const parseEnvLimit = (): number => {
  const envValue = Number(import.meta.env?.VITE_MAX_LICENSES_PER_SCHOOL);
  return Number.isFinite(envValue) && envValue > 0 ? envValue : DEFAULT_MAX_LICENSES;
};

const readStoredLimit = (): number | undefined => {
  if (typeof window === "undefined") return undefined;
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : undefined;
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const subscribeToLicenseLimit = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getMaxLicensesPerSchool = (): number => {
  return readStoredLimit() ?? parseEnvLimit();
};

export const setMaxLicensesPerSchool = (value: number) => {
  if (typeof window === "undefined") return;
  const safeValue = Math.max(1, Math.floor(Number(value)));
  localStorage.setItem(STORAGE_KEY, safeValue.toString());
  notify();
};

export const resetMaxLicensesPerSchool = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  notify();
};

export const useLicenseLimit = () =>
  useSyncExternalStore(subscribeToLicenseLimit, getMaxLicensesPerSchool, getMaxLicensesPerSchool);

export const MAX_LICENSES_PER_SCHOOL = getMaxLicensesPerSchool();

export const getLicenseLimitForSchool = (totalLicenses?: number): number => {
  if (typeof totalLicenses === "number" && totalLicenses > 0) {
    return totalLicenses;
  }
  return getMaxLicensesPerSchool();
};

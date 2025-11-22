import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseEnvLimit } from '@/config/licenseLimits';

type ConfigState = {
  licenseLimitPerSchool: number;
  setLicenseLimitPerSchool: (value: number) => void;
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      licenseLimitPerSchool: parseEnvLimit(),
      setLicenseLimitPerSchool: (value: number) => {
        const sanitized = Number.isFinite(value) && value > 0 ? Math.floor(value) : parseEnvLimit();
        set({ licenseLimitPerSchool: sanitized });
      }
    }),
    {
      name: 'saf-config-store'
    }
  )
);

export const getCurrentLicenseLimit = (): number => useConfigStore.getState().licenseLimitPerSchool;

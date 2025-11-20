// src/setupTests.ts

// Mock the environment variables used by Vite
// This is necessary because Jest runs in a Node environment where import.meta.env is not available.
// We are providing mock values for the variables used in AuthService.ts
const MOCK_ENV = {
  VITE_ADMIN_ROLE: 'admin',
  VITE_ADMIN_EMAIL: 'admin@test.com',
  VITE_ADMIN_PASSWORD: 'password',
  VITE_ADMIN_NAME: 'Test Admin',
  VITE_ENFORCE_MONDAY_LOGOUT: 'false',
};

// Mock the global import.meta object
// We need to cast it to any to avoid TypeScript errors in the setup file itself
(global as any).import = {
  meta: {
    env: MOCK_ENV,
  },
};

// Import the jest-dom setup
import '@testing-library/jest-dom';

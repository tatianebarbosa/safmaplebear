import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    // Handle module aliases (as defined in vite.config.ts)
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS imports (e.g., for Tailwind CSS)
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  transform: {
    // Use ts-jest for TypeScript files
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  // Ignore the Python test files in the root 'tests' directory
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/', // Ignoring the existing Python tests
  ],
  // Look for tests in a dedicated 'src/tests' folder
  testMatch: ['<rootDir>/src/**/*.test.(ts|tsx)'],
};

export default config;

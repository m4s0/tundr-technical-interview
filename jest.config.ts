import { JestConfigWithTsJest, pathsToModuleNameMapper } from 'ts-jest';
import { readFileSync } from 'fs';

const tsConfig = JSON.parse(readFileSync('./tsconfig.json', 'utf-8').replace(/\/\/.+/g, ''));

type ProjectOptions = NonNullable<JestConfigWithTsJest['projects']>[number];

const commonProject: ProjectOptions = {
  moduleFileExtensions: ['js', 'json', 'ts', 'd.ts', 'mjs'],
  modulePaths: ['<rootDir>'],
  modulePathIgnorePatterns: ['<rootDir>/dist', '<rootDir>/node_modules'],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(tsConfig.compilerOptions.paths, { prefix: '<rootDir>/' }),
  },
  preset: 'ts-jest',
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': ['ts-jest', {}],
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

const jestConfig: JestConfigWithTsJest = {
  projects: [
    {
      ...commonProject,
      displayName: 'unit',
      testMatch: ['**/*.spec.ts'],
    },
    {
      ...commonProject,
      displayName: 'integration',
      testMatch: ['**/*.e2e-spec.ts'],
    },
    {
      ...commonProject,
      transform: {},
      displayName: 'eslint',
      testMatch: ['<rootDir>/eslint-plugins/**/*.spec.mjs'],
    },
  ],
  randomize: true,
  testTimeout: 10_000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // This option is required for CI to avoid memory issues and for faster deployment
  // Disabled locally because it causes issues when showing failed test results (circular structure)
  // https://github.com/jestjs/jest/issues/14840
  // The issue is caused by using workers, and workers are automatically enabled when this option is set
  ...(process.env.CI ? { workerIdleMemoryLimit: '512mb' } : {}),
  // Enable for finding slow tests
  // reporters: [
  //   'jest-slow-test-reporter',
  //   { numTests: 10, warnOnSlowerThan: 1080, color: true },
  // ],
};

export default jestConfig;

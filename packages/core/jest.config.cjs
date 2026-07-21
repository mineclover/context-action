/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  // Memory optimization
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  detectOpenHandles: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@context-action/core$': '<rootDir>/src/index',
    '^@context-action/tool-protocol$': '<rootDir>/../tool-protocol/src/index',
    '^(.+)\\.js$': '$1'
  },
  testMatch: [
    '**/__tests__/simple-working.test.ts',
    '**/__tests__/unit/*.test.ts',
    '**/__tests__/production/*.test.ts',
    '**/__tests__/feature-coverage/*.test.ts',
    '**/__tests__/individual-features/*.test.ts',
    '**/__tests__/concurrency/*.test.ts',
    '**/__tests__/edge-cases/*.test.ts',
    '**/__tests__/comprehensive/*.test.ts',
    '**/__tests__/schema/*.test.ts',
    '**/__tests__/type-safety/*.test.ts',
    '**/__tests__/working/*.test.ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        target: 'es2020',
        transform: { react: { runtime: 'automatic' } }
      },
      module: { type: 'commonjs' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/__tests__/**',
    '!src/**/examples/**'
  ],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/examples/',
    'type-tests.ts' // Type tests don't need to run as Jest tests
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true
};

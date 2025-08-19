/** @type {import('jest').Config} */
/* eslint-env node */
/* global process */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: process.env.CI ? 60000 : 30000, // Longer timeout in CI
  // Skip slow integration tests in CI unless explicitly enabled  
  testPathIgnorePatterns: process.env.CI && !process.env.RUN_SLOW_TESTS ? [
    '<rootDir>/__tests__/Performance.test.ts',
    '<rootDir>/__tests__/ErrorRecovery.test.ts'
  ] : [],
  verbose: true
}
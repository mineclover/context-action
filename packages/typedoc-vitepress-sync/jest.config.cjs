/** @type {import('jest').Config} */
/* eslint-env node */
/* global process */
const shouldRunSlowTests = process.env.RUN_SLOW_TESTS === '1'
  || process.env.npm_lifecycle_event === 'test:performance'

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript' },
        target: 'es2020'
      },
      module: { type: 'commonjs' }
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
  testPathIgnorePatterns: process.env.CI && !shouldRunSlowTests ? [
    '<rootDir>/__tests__/Performance.test.ts'
  ] : [],
  verbose: true
}

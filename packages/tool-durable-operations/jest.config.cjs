/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  moduleNameMapper: {
    '^@context-action/tool-durable-operations$': '<rootDir>/src/index',
    '^@context-action/tool-durable-operations/(.*)$': '<rootDir>/src/$1',
    '^(.+)\\.js$': '$1'
  },
  testMatch: ['**/__tests__/schema/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        target: 'es2020'
      },
      module: { type: 'commonjs' }
    }]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: [],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  verbose: true
}

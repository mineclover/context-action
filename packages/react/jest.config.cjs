/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@context-action/react$': '<rootDir>/src/index',
    '^@context-action/core$': '<rootDir>/../core/src/index',
    '^@context-action/tool-protocol$': '<rootDir>/../tool-protocol/src/index',
    '^@context-action/tool-durable-operations$': '<rootDir>/../tool-durable-operations/src/index',
    '^@context-action/mutative$': '<rootDir>/../mutative/dist/index.cjs',
    '^react$': '<rootDir>/node_modules/react',
    '^react/jsx-runtime$': '<rootDir>/node_modules/react/jsx-runtime',
    '^react/jsx-dev-runtime$': '<rootDir>/node_modules/react/jsx-dev-runtime',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react-dom/client$': '<rootDir>/node_modules/react-dom/client',
    '^(.+)\\.js$': '$1'
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}'
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
    'type-tests.tsx' // Type tests don't need to run as Jest tests
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  verbose: true
};

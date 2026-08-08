/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  maxWorkers: 1,
  moduleNameMapper: {
    '^@context-action/tool-protocol$': '<rootDir>/../tool-protocol/src/index',
    '^(.+)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', {
      jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
      module: { type: 'commonjs' },
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/test/**/*.test.ts', '**/test/**/*.test.js', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'typescript' },
        target: 'es2020'
      },
      module: { type: 'commonjs' }
    }],
    '^.+\\.js$': ['@swc/jest', {
      jsc: {
        parser: { syntax: 'ecmascript' },
        target: 'es2020'
      },
      module: { type: 'commonjs' }
    }]
  },
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/.pnpm/(?!(commander)@)',
    'node_modules/(?!.pnpm|commander/)'
  ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/cli/index.ts', // Exclude main CLI entry point
    '!src/cli/utils/ArgumentParser.ts', // Exclude utility classes from coverage
    '!src/cli/core/ErrorHandler.ts' // Exclude error handler from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html']
};

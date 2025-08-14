module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'off', // TypeScript handles this
    'no-redeclare': 'off',
  },
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  overrides: [
    {
      // Test files and type tests - allow unused vars for type checking
      files: [
        '**/__tests__/**/*',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/type-tests.tsx'
      ],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn', // Change to warning for test files
      },
    },
  ],
};
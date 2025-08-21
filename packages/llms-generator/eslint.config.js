import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '*.d.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript-specific rules
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // Disable base rules that TypeScript handles
      'no-unused-vars': 'off',
      'no-undef': 'off', // TypeScript handles this
      'no-dupe-class-members': 'off', // TypeScript handles overloads
      
      // Code quality rules
      'no-case-declarations': 'off',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-regex-spaces': 'error',
      
      // Best practices
      'eqeqeq': ['warn', 'always'],
      'no-eval': 'error',
      'prefer-const': 'warn'
    },
  },
];
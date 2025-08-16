// import { defineConfig } from 'tsdown';

export default {
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts'
  },
  format: ['esm'],
  target: 'node18',
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
  shims: true,
  banner: {
    'cli/index': '#!/usr/bin/env node',
  },
  esbuildOptions: {
    conditions: ['node'],
    // Bundle optimization
    treeShaking: true,
    minify: false, // Keep readable for debugging
    splitting: true, // Enable code splitting
  },
  // Optimize external dependencies
  external: [
    'commander',
    'yaml',
    'ajv',
    'ajv-formats',
    'gray-matter'
  ]
};
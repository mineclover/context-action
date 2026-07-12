// import { defineConfig } from 'tsdown';

export default {
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts'
  },
  format: ['esm'],
  target: 'node24',
  tsconfig: './tsconfig.json',
  clean: true,
  fixedExtension: false,
  hash: false,
  dts: true,
  shims: true,
  banner: {
    'cli/index': '#!/usr/bin/env node',
  },
  treeshake: true,
  minify: false,
  // Optimize external dependencies
  deps: {
    neverBundle: ['commander', 'gray-matter'],
  },
};

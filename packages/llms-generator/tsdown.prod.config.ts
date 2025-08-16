// Production build configuration
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
    // Production optimizations
    treeShaking: true,
    minify: true,
    splitting: true,
    sourcemap: false,
    // Remove debug code
    drop: ['console', 'debugger'],
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
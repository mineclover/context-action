// import { defineConfig } from 'tsdown';

export default {
  entry: {
    index: 'src/index.ts',
    'cli/index': 'src/cli/index.ts'
  },
  format: ['esm'],
  target: 'node18',
  clean: true,
  dts: true,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions: {
    conditions: ['node']
  }
};
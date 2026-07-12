import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/index.ts', 'src/analyzers/babel-plugin.ts'],
  format: ['esm'],
  target: 'node24',
  dts: true,
  clean: true,
  fixedExtension: false,
  shims: true,
});

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  fixedExtension: false,
  sourcemap: true,
  treeshake: true,
  outDir: 'dist',
});

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  minify: process.env.NODE_ENV === 'production',
  external: ['mutative'],
  outDir: 'dist',
});

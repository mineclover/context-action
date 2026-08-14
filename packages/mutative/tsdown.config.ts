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
  // Replace development guards at build time so browser consumers do not
  // require a Node.js `process` global during module evaluation.
  env: {
    NODE_ENV: process.env.NODE_ENV ?? 'production',
  },
  minify: process.env.NODE_ENV === 'production',
  deps: {
    neverBundle: ['@context-action/mutative-core'],
  },
  outDir: 'dist',
});

import { defineConfig } from 'tsdown';

// Runtime dependencies remain external; the host supplies the Lit runtime.
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
  deps: {
    neverBundle: ['lit', '@lit/reactive-element'],
  },
});

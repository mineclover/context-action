import { defineConfig } from 'tsdown';

// Runtime dependencies remain external; the host supplies Lit, @lit/context, and React.
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
    neverBundle: [
      'lit',
      '@lit/reactive-element',
      '@lit/context',
      'react',
      'react-dom',
      '@context-action/core',
      '@context-action/lit',
    ],
  },
});

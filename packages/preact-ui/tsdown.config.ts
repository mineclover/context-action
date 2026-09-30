import { defineConfig } from 'tsdown';

// Runtime dependencies remain external; the host supplies one Preact/Signals copy.
export default defineConfig({
  entry: ['src/index.ts', 'src/react-bridge.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  fixedExtension: false,
  sourcemap: true,
  treeshake: true,
  outDir: 'dist',
  deps: {
    neverBundle: ['react', 'react-dom', 'preact', '@preact/signals'],
  },
});

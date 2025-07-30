import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['jotai', 'react', '@context-action/core'],
  // sourcemap: true,
  target: 'es2020',
})
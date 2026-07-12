import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: true,
  hash: false,
  clean: true,
  fixedExtension: false,
  outDir: 'dist',
  target: 'node24',
  sourcemap: true,
  minify: false,
  deps: {
    neverBundle: ['commander', 'chalk', 'ora'],
  },
})

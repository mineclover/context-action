import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  splitting: false,
  sourcemap: true,
  minify: false,
  external: [
    'commander',
    'chalk',
    'ora',
    'picocolors'
  ]
})
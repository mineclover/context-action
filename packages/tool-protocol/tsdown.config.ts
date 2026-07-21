import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  nodeProtocol: 'strip',
  target: 'es2020',
  minify: false,
  platform: 'browser',
})

import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
  target: 'es2020',
  minify: false,
  platform: 'browser', // Explicitly target browser platform

})

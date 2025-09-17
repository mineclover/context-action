import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  external: [
    'react',
    'react-dom'
  ],
  target: 'es2020',
  minify: false,
  platform: 'browser', // Explicitly target browser platform

})
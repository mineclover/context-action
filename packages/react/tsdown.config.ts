import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts'       // Utility functions
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'immer'
  ],
  target: 'es2020',
  platform: 'browser' // Explicitly target browser platform
})
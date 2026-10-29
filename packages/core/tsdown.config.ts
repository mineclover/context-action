import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/element.ts', 'src/element-react.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // Shared declaration chunks must not collide with public entry basenames.
  hash: true,
  clean: true,
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  deps: {
    neverBundle: ['react', 'react-dom'],
  },
  target: 'es2020',
  minify: false,
  platform: 'browser', // Explicitly target browser platform

})

import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts',      // Utility functions
    'src/react18.ts',    // React 18/19 compatibility entry point
    'src/tools/index.ts', // Stable ToolContext entry point
    'src/webmcp.ts', // Experimental browser adapter entry point
  ],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  // Make development-only branches deterministic in published artifacts.
  // tsdown only injects process environment variables with its configured prefix.
  env: {
    NODE_ENV: process.env.NODE_ENV ?? 'production',
  },
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  deps: {
    neverBundle: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'immer',
    ],
  },
  target: 'es2022',
  platform: 'browser', // Explicitly target browser platform
})

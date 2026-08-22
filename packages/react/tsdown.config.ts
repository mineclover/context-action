import { defineConfig } from 'tsdown'
import babel from '@rolldown/plugin-babel'
import reactCompiler from 'babel-plugin-react-compiler'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts',      // Utility functions
    'src/webmcp.ts', // Experimental browser adapter entry point
  ],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  outputOptions(options, format) {
    return {
      ...options,
      chunkFileNames: `chunks/[name].${format === 'cjs' ? 'cjs' : 'js'}`,
    }
  },
  clean: true,
  // Publish compiler-optimized hooks. Annotation mode limits compilation to
  // functions that explicitly opt in with a "use memo" directive.
  plugins: [
    babel({
      plugins: [[reactCompiler, {
        compilationMode: 'annotation',
        target: '19',
      }]],
    }),
  ],
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

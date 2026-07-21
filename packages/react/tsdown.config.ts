import { defineConfig } from 'tsdown'
import babel from '@rolldown/plugin-babel'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts',      // Utility functions
    'src/react18.ts'     // React 18/19 compatibility entry point
  ],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
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
  plugins: [
    babel({
      plugins: [
        ['babel-plugin-react-compiler', {
          target: '19',
          compilationMode: 'annotation',
        }],
      ],
    }),
  ],
})

import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts'       // Utility functions
  ],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  nodeProtocol: 'strip', // Strip node: protocol for browser compatibility
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'react/jsx-dev-runtime',
    'react-compiler-runtime', // React Compiler runtime
    'immer'
  ],
  target: 'es2020',
  platform: 'browser', // Explicitly target browser platform
  // React Compiler 통합
  babel: {
    plugins: [
      ['babel-plugin-react-compiler', {
        target: '17', // 최소 지원 React 버전
        compilationMode: 'annotation', // "use memo" 지시어 기반 컴파일
      }],
    ],
  },
})
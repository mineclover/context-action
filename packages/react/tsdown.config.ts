import { defineConfig } from 'tsdown'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/react18.ts',    // React 18+ features
    'src/utils.ts'       // Utility functions
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'immer'],
  target: 'es2020',
  minify: false,
  rollupOptions: {
    plugins: [
      visualizer({
        filename: 'reports/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ]
  }
})
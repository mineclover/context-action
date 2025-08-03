import { defineConfig } from 'tsdown'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  // sourcemap: true,
  target: 'es2020',
  rollupOptions: {
    plugins: [
      visualizer({
        filename: 'reports/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap' // sunburst, treemap, network
      })
    ]
  }
})
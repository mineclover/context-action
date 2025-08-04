import { defineConfig } from 'tsdown'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
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
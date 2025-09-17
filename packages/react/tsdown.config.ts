import { defineConfig } from 'tsdown'
import { visualizer } from 'rollup-plugin-visualizer'

// Determine if this is a production build
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  entry: [
    'src/index.ts',      // Main entry point
    'src/advanced.ts',   // Advanced features
    'src/utils.ts'       // Utility functions
  ],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'immer'],
  target: 'es2020',
  minify: isProduction,
  
  // Define constants that will be replaced at build time
  define: {
    // In production, replace process.env.NODE_ENV with 'production'
    // This allows dead code elimination to remove debug code
    'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development')
  },
  
  // Rollup input options (plugins, treeshake 등)
  inputOptions: {
    plugins: [
      visualizer({
        filename: 'reports/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ],
    
    // Tree-shaking options for production
    treeshake: isProduction
  }
})
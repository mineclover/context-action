import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist-standalone',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, 'examples/projected-order/standalone-entry.ts'),
      name: 'ContextActionOrderWorkspace',
      fileName: (format) => `order-workspace.${format}.js`,
      formats: ['umd', 'iife', 'es'],
    },
    minify: 'terser',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});

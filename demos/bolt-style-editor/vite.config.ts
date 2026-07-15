import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base:
    process.env.NODE_ENV === 'production' ? '/context-action/web-coding/' : '/',
  resolve: {
    alias: {
      '@context-action/core': path.resolve(
        __dirname,
        '../../packages/core/src/index.ts'
      ),
      '@context-action/react': path.resolve(
        __dirname,
        '../../packages/react/src/index.ts'
      ),
      '@context-action/mutative': path.resolve(
        __dirname,
        '../../packages/mutative/src/index.ts'
      ),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('/node_modules/dexie/')) return 'storage-vendor';
          if (id.includes('/node_modules/mutative/')) return 'mutative-vendor';
          if (id.includes('/node_modules/zod/')) return 'schema-vendor';
          if (id.includes('/node_modules/')) return 'vendor';
          if (
            id.includes('/packages/core/src/') ||
            id.includes('/packages/react/src/') ||
            id.includes('/packages/mutative/src/')
          ) {
            return 'context-action';
          }
          return undefined;
        },
      },
    },
  },
});

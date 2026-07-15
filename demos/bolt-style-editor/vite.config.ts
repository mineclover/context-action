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
  },
});

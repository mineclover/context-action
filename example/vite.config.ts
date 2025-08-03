import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
  },
  build: {
    // 청크 크기 최적화
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리를 별도 청크로 분리
          vendor: ['react', 'react-dom'],
          // React Router를 별도 청크로 분리
          router: ['react-router-dom'],
          // Context-Action 프레임워크를 별도 청크로 분리
          'context-action': [
            '@context-action/core', 
            '@context-action/react',
            '@context-action/logger'
          ],
        },
      },
    },
    // 소스맵 최적화
    sourcemap: false,
    // 압축 최적화 (기본 esbuild 사용)
    minify: 'esbuild',
  },
  resolve: {
    alias: {
      '@context-action/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@context-action/react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      '@context-action/logger': path.resolve(__dirname, '../packages/logger/src/index.ts'),
    }
  },
  // CSS 최적화
  css: {
    devSourcemap: false,
    postcss: './postcss.config.js',
  },
})
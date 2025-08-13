import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 배포를 위한 base path 설정
  base: process.env.NODE_ENV === 'production' ? '/context-action-example/' : '/',
  server: {
    port: 4000,
    hmr: {
      overlay: true,
    },
    watch: {
      // 패키지 소스 코드 변경도 감지
      ignored: ['!**/packages/**'],
    },
  },
  // 개발 시 의존성 사전 번들링 최적화
  optimizeDeps: {
    // 워크스페이스 패키지들은 사전 번들링에서 제외
    exclude: [
      '@context-action/core',
      '@context-action/react', 
      '@context-action/logger',
      '@context-action/jotai'
    ],
    // 빠른 개발을 위한 esbuild 설정
    esbuildOptions: {
      target: 'es2020',
    },
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
    devSourcemap: true, // 개발 시 CSS 소스맵 활성화
    postcss: './postcss.config.js',
  },
  // 개발 시 소스맵 설정
  define: {
    __DEV__: JSON.stringify(true),
  },
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '19', // React 19 사용
            compilationMode: 'infer', // 모든 React 컴포넌트 자동 컴파일
          }],
        ],
      },
    })
  ],
  // GitHub Pages 배포를 위한 base path 설정
  base: process.env.NODE_ENV === 'production' ? '/context-action/example/' : '/',
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
      '@context-action/react'
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
        // Manual splitting for stable vendors only
        // Workspace packages will be bundled with app code to avoid React duplication
        manualChunks: (id) => {
          // Only chunk node_modules dependencies
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react/')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
          }
          // Don't manually chunk workspace packages - they share React with app code
        },
      },
    },
    // 소스맵 최적화
    sourcemap: false,
    // 압축 최적화 (기본 esbuild 사용)
    minify: 'esbuild',
  },
  resolve: {
    // React 중복 방지 - 모든 패키지가 동일한 React 인스턴스 사용
    dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    alias: {
      '@context-action/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@context-action/react': path.resolve(__dirname, '../packages/react/src/index.ts'),
      // Path mapping for refactored directories
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types')
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
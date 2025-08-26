// Vite 리팩토링용 Path Mapping 설정
// 기존 vite.config.ts에 추가할 설정

import path from 'path';
import { defineConfig } from 'vite';

// Path mapping 설정 예시
const pathMappingConfig = defineConfig({
  resolve: {
    alias: {
      // 절대 경로 설정
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
      
      // 세부 경로 설정
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      
      // 라이브러리 경로
      '@/lib/templates': path.resolve(__dirname, './src/lib/templates'),
      '@/lib/patterns': path.resolve(__dirname, './src/lib/patterns'),
      '@/lib/hooks': path.resolve(__dirname, './src/lib/hooks'),
      '@/lib/services': path.resolve(__dirname, './src/lib/services'),
    },
  },
});

export default pathMappingConfig;

// 기존 vite.config.ts 파일에 아래 alias 설정을 추가하세요:
/*
export default defineConfig({
  // ... 기존 설정
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  // ... 기존 설정
});
*/
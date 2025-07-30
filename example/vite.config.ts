import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@context-action/core': '../core/src/index.ts',
      '@context-action/react': '../react/src/index.ts'
    }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
  },
  resolve: {
    alias: {
      '@context-action/core': path.resolve(__dirname, '../packages/core/src/index.ts'),
      '@context-action/react': path.resolve(__dirname, '../packages/react/src/index.ts')
    }
  }
})
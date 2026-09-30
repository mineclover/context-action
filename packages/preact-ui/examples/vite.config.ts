import path from 'node:path';
import { defineConfig } from 'vite';

const packageRoot = path.resolve(import.meta.dirname, '..');

export default defineConfig({
  root: import.meta.dirname,
  server: {
    fs: {
      allow: [packageRoot],
    },
  },
});

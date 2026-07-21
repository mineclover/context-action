import net from 'node:net';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

async function reserveDevelopmentPort(): Promise<number> {
  while (true) {
    const port = await new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        const candidate =
          typeof address === 'object' && address ? address.port : 0;
        server.close((error) => (error ? reject(error) : resolve(candidate)));
      });
    });
    if (port !== 4173 && port !== 5173) return port;
  }
}

const configuredDevPort = Number.parseInt(
  process.env.WEB_CODING_PORT ?? '',
  10
);
const defaultDevPort =
  Number.isInteger(configuredDevPort) && configuredDevPort > 0
    ? configuredDevPort
    : await reserveDevelopmentPort();

export default defineConfig({
  plugins: [react()],
  base:
    process.env.NODE_ENV === 'production' ? '/context-action/web-coding/' : '/',
  server: {
    host: '127.0.0.1',
    port: defaultDevPort,
  },
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
      '@context-action/tool-protocol': path.resolve(
        __dirname,
        '../../packages/tool-protocol/src/index.ts'
      ),
      '@context-action/tool-durable-operations': path.resolve(
        __dirname,
        '../../packages/tool-durable-operations/src/index.ts'
      ),
      '@context-action/mutative': path.resolve(
        __dirname,
        '../../packages/mutative/src/index.ts'
      ),
      '@context-action/live-code-editor': path.resolve(
        __dirname,
        '../../packages/live-code-editor/src/index.ts'
      ),
      '@context-action/openrouter-browser-storage': path.resolve(
        __dirname,
        '../../packages/openrouter-browser-storage/src/index.ts'
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

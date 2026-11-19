import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/effect.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: true,
  clean: true,
  deps: {
    neverBundle: [
      '@context-action/core',
      '@context-action/core/element',
      '@context-action/store-core',
      'xstate',
      'effect',
      '@xstate/effect',
    ],
  },
  target: 'es2022',
  platform: 'neutral',
});

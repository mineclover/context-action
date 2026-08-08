import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/profiles/chrome-legacy.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  hash: false,
  clean: true,
  target: 'es2022',
  platform: 'neutral',
});

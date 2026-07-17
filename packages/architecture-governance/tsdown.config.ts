import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts'],
  format: ['esm'],
  dts: true,
  fixedExtension: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  deps: {
    alwaysBundle: ['@sem-foundation/contracts', '@sem-foundation/repository'],
  },
  outDir: 'dist',
});

import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cli/index.ts',
    'src/extractors/index.ts',
    'src/generators/index.ts',
    'src/validators/index.ts',
    'src/types/index.ts'
  ],
  format: ['esm'],
  target: 'node24',
  dts: true,
  clean: true,
  fixedExtension: false,
  minify: false,
  sourcemap: true,
  deps: {
    neverBundle: []
  }
});

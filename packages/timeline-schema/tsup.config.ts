import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
  },
  {
    entry: ['src/adapters/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    outDir: 'dist/adapters',
    outExtension: () => ({ js: '.js' }),
  },
]);

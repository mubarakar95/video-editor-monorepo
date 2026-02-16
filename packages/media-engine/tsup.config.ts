import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'webcodecs/index': 'src/webcodecs/index.ts',
    'ffmpeg/index': 'src/ffmpeg/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@video-editor/shared-types'],
});

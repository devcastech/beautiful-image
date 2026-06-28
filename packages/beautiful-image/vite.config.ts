import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        'beautiful-image': resolve(__dirname, 'lib/main.ts'),
        'beautiful-image.node': resolve(__dirname, 'lib/main.node.ts'),
      },
      name: 'beautiful-image',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {},
  },
  plugins: [
    dts({
      include: ['lib'],
      rollupTypes: true,
      tsconfigPath: resolve(__dirname, 'tsconfig.app.json'),
    }),
  ],
});

import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'src/partials'),
    }),
    viteSingleFile(),
  ],
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: {
        scanner: resolve(__dirname, 'scanner.html'),
      }
    }
  },
});

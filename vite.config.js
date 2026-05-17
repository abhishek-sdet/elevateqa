import { defineConfig } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import { resolve } from 'path';

export default defineConfig({
  root: 'website',
  plugins: [
    handlebars({
      partialDirectory: resolve(__dirname, 'website/src/partials'),
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'website/index.html'),
        admin: resolve(__dirname, 'website/admin.html'),
        scanner: resolve(__dirname, 'website/scanner.html'),
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true
  }
});

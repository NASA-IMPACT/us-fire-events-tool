import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~uswds': path.resolve(__dirname, 'node_modules/@uswds/uswds'),
      '@deck.gl/react/typed': path.resolve(__dirname, 'node_modules/@deck.gl/react/dist/index.js'),
      '@deck.gl/mapbox/typed': path.resolve(__dirname, 'node_modules/@deck.gl/mapbox/dist/index.js')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        includePaths: ['node_modules/@uswds/uswds/packages']
      }
    }
  }
});

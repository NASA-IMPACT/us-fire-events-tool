import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // build: {
  //   lib: {
  //     entry: resolve(__dirname, 'src/index.ts'),
  //     name: 'WildfireExplorer',
  //     fileName: 'wildfire-explorer',
  //     formats: ['es', 'umd'],
  //     cssFileName: 'wildfire-explorer'
  //   },
  //   rollupOptions: {
  //     external: ['react', 'react-dom'],
  //     output: {
  //       globals: {
  //         react: 'React',
  //         'react-dom': 'ReactDOM'
  //       }
  //     }
  //   }
  // },
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

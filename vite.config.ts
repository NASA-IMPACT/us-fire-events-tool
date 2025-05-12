import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'WildfireExplorer',
      fileName: 'wildfire-explorer',
      formats: ['es', 'umd'],
      cssFileName: 'wildfire-explorer'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  resolve: {
    alias: {
      '~uswds': path.resolve(__dirname, 'node_modules/@uswds/uswds')
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

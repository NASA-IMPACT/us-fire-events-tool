import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~uswds': path.resolve(__dirname, 'node_modules/@uswds/uswds'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        // additionalData: `
        //   @forward './uswds-theme.scss';
        //   @forward '~uswds/packages/uswds';

        //   @use '~uswds/packages/uswds-core' as *;
        // `,
        includePaths: ['node_modules/@uswds/uswds/packages'],
      },
    },
  },
});

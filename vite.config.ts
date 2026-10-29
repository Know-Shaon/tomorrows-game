import { cloudflare } from '@cloudflare/vite-plugin';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), cloudflare()],
  // Generated browser traces contain HTML. Watching them causes reload work and
  // can hit OneDrive file locks while tests are still writing their evidence.
  server: {
    watch: {
      ignored: [
        '**/.cache/**',
        '**/test-results/**',
        '**/screenshots/**',
        '**/playwright-report/**',
        '**/outputs/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@frontend': fileURLToPath(new URL('./frontend', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
});

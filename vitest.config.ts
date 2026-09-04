import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@frontend': fileURLToPath(new URL('./frontend', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['frontend/**/*.test.{ts,tsx}', 'shared/**/*.test.ts'],
    css: true,
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});

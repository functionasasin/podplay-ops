import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/e2e/**'],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

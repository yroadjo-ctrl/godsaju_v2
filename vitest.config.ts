import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['core/src/**/*.test.ts', 'client/src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@core': path.resolve(import.meta.dirname, 'core', 'src'),
    },
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: ['tests/gameplay/**', 'node_modules/**'],
  },
});

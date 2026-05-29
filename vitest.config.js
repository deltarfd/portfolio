import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default environment for existing tests (node)
    environment: 'node',
    // Override environment for DOM tests
    environmentMatchGlobs: [
      ['tests/**', 'jsdom'],
    ],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        'prisma/',
        'src-ts-backup/'
      ]
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    fileParallelism: false
  }
});


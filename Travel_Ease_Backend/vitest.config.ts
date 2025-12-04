import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.js',
        'prisma/',
        'dist/',
        'src-ts-backup/',
        'scripts/',
        '**/*.d.ts',
      ],
      include: [
        'src/**/*.ts',
        'travel_plan/**/*.ts',
        'business/**/*.ts',
        'user/**/*.ts',
        'routes/**/*.ts',
      ],
      // Coverage thresholds - warn if below 50%, fail CI if below 40%
      thresholds: {
        statements: 40,
        branches: 35,
        functions: 40,
        lines: 40,
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    fileParallelism: false
  }
});

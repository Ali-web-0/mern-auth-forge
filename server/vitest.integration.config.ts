import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.spec.ts'],
    globals: true,
    testTimeout: 20000,
    hookTimeout: 20000,
    setupFiles: ['./tests/integration/setup.ts'],
  },
})

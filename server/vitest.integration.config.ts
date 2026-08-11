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
    // mongodb-memory-server downloads the actual MongoDB binary (~600MB) on
    // its very first run and caches it afterward — every run after the
    // first is fast. Generous enough to survive that one-time download on a
    // normal connection. globalSetup below means this download only ever
    // happens once for the whole run, not once per file.
    hookTimeout: 180000,
    // All 4 files now share ONE MongoDB instance (see globalSetup.ts) — keep
    // them from running concurrently so one file's afterEach (which wipes
    // all collections) can't clobber another file's test mid-run.
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    globalSetup: ['./tests/integration/globalSetup.ts'],
    setupFiles: ['./tests/integration/setup.ts'],
  },
})

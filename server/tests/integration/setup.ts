import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll } from 'vitest'

// Runs once before any integration spec file's imports are evaluated
// (Vitest guarantees setupFiles execute first), so env.ts's fail-fast
// validation always sees a complete, valid config. MONGODB_URI is a
// placeholder — the real connection below points at the shared in-memory
// server started once in globalSetup.ts, since createApp() never touches
// the DB connection itself (that's server.ts's job). This is what makes
// the Express app testable without spinning up the real entrypoint.
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://placeholder-not-used-in-tests/mern-auth-forge-test'
process.env.JWT_ACCESS_SECRET = 'test-only-secret-at-least-32-characters-long'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN_DAYS = '7'
process.env.CLIENT_ORIGIN = 'http://localhost:5173'
process.env.BCRYPT_SALT_ROUNDS = '10' // env.ts enforces a minimum of 10 — this is as fast as tests are allowed to go

beforeAll(async () => {
  const uri = process.env.MONGO_MEMORY_SERVER_URI
  if (!uri) {
    throw new Error(
      'MONGO_MEMORY_SERVER_URI is not set — globalSetup.ts did not run. Check vitest.integration.config.ts.',
    )
  }
  await mongoose.connect(uri)
})

afterEach(async () => {
  // Isolate every test — wipe all collections between tests instead of
  // reusing state across specs. Safe because fileParallelism is off (see
  // vitest.integration.config.ts): only one file's tests ever touch the
  // shared database at a time, so this can't wipe data another file is
  // mid-test with.
  const collections = mongoose.connection.collections
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  // Each file just closes its own connection — the shared server itself is
  // stopped once, for the whole run, by globalSetup.ts's teardown().
  await mongoose.disconnect()
})

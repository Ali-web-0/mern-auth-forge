import { MongoMemoryServer } from 'mongodb-memory-server'

// Vitest runs globalSetup exactly once for the whole test run, in the main
// process, BEFORE any test file's worker starts — unlike setupFiles, which
// runs once PER file. That distinction is the whole fix here: with
// setupFiles alone, each of the 4 integration spec files was independently
// calling MongoMemoryServer.create(), and on a cold cache all 4 tried to
// download the same ~600MB MongoDB binary at once, fighting for bandwidth.
// One shared instance here means the binary downloads exactly once, and
// every file just connects to the same already-running server.
let mongoServer: MongoMemoryServer

export async function setup() {
  mongoServer = await MongoMemoryServer.create()
  // process.env set here IS visible to every worker process Vitest spawns
  // for the actual test files — this is the documented way to hand a
  // globalSetup-created resource down to them.
  process.env.MONGO_MEMORY_SERVER_URI = mongoServer.getUri()
}

export async function teardown() {
  await mongoServer?.stop()
}

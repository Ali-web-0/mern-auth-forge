// A handful of unit specs (e.g. lib/tokens.spec.ts) import modules that
// transitively import lib/env.ts, which validates process.env at import
// time. Setting fallback values here — before any spec file's imports are
// evaluated — means those specs don't need special dynamic-import handling.
process.env.MONGODB_URI ??= 'mongodb://localhost:27017/test'
process.env.JWT_ACCESS_SECRET ??= 'unit-test-secret-at-least-32-characters-long'
process.env.CLIENT_ORIGIN ??= 'http://localhost:5173'

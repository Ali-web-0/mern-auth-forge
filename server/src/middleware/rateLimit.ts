import rateLimit from 'express-rate-limit'
import { env } from '@/lib/env.js'

// Login/register are brute-force targets — cap attempts per IP independently
// of the app's general traffic. Refresh gets a looser limit since a
// legitimate client can legitimately call it often (tab focus, app resume).
// See: MERN_Best_Practices_Checklist.md, section 9 (defense in depth at the
// edge, not just in application logic).
//
// Disabled under NODE_ENV=test: integration tests reuse one Express app
// (and therefore one in-memory limiter store) across many requests in the
// same file, which isn't a real client hammering the endpoint — it's the
// test suite itself. A real deployment always runs with NODE_ENV=production
// or development, so this never weakens the limiter outside of tests.
const skipInTests = () => env.NODE_ENV === 'test'

export const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, error: { message: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' } },
})

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: { success: false, error: { message: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' } },
})

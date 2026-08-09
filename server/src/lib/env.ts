import { z } from 'zod'

/**
 * All required environment variables are validated once, here, at import time.
 * If anything is missing or malformed, the process fails immediately with a
 * clear message — instead of surfacing as a cryptic error three requests later.
 *
 * See: MERN_Best_Practices_Checklist.md, section 12.
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  CLIENT_ORIGIN: z.string().url(),

  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  // Optional on purpose — cloning the repo and running `npm run dev` should
  // work immediately with zero external accounts. If RESEND_API_KEY isn't
  // set, lib/mailer.ts falls back to logging the email to the console
  // instead of sending it. Set both to actually send real email.
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('onboarding@resend.dev'),
})

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  return parsed.data
}

export const env = loadEnv()
export type Env = z.infer<typeof EnvSchema>

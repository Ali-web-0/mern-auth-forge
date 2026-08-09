import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { env } from '@/lib/env.js'

export interface AccessTokenPayload {
  sub: string // user id
  email: string
  role: 'user' | 'admin'
}

/**
 * Short-lived access token (default 15m). Sent on every request, never
 * stored server-side — verified purely by signature + expiry.
 */
export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
}

/**
 * Generic secure random token generator, used for refresh tokens (milestone 3)
 * and password reset tokens (milestone 6). Returns the raw token — callers
 * are responsible for hashing it before storing in the DB.
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(48).toString('hex')
}

/**
 * SHA-256 hash of a token for DB storage. We never store raw refresh/reset
 * tokens — only their hash — so a DB leak alone doesn't expose usable tokens.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

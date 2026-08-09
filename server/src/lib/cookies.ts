import type { Response } from 'express'
import { env } from '@/lib/env.js'

// Refresh token lives in an httpOnly cookie — never readable by client JS,
// so an XSS bug can't exfiltrate it. The access token, by contrast, is
// returned in the JSON body and kept in memory on the client. Scoping the
// cookie path to /api/auth means the browser only sends it to the
// refresh/logout endpoints, not on every request.
// See: MERN_Best_Practices_Checklist.md, section 7.

const REFRESH_TOKEN_COOKIE = 'refreshToken'
const COOKIE_PATH = '/api/auth'

export function setRefreshTokenCookie(res: Response, token: string, expiresAt: Date): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
    expires: expiresAt,
  })
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: COOKIE_PATH,
  })
}

export function getRefreshTokenCookie(cookies: Record<string, unknown> | undefined): string | undefined {
  const value = cookies?.[REFRESH_TOKEN_COOKIE]
  return typeof value === 'string' ? value : undefined
}

import type { NextFunction, Request, Response } from 'express'
import { AuthenticationError } from '@/lib/errors.js'
import { type AccessTokenPayload, verifyAccessToken } from '@/lib/tokens.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessTokenPayload
    }
  }
}

/**
 * Verifies the Authorization: Bearer <accessToken> header and attaches the
 * decoded payload to req.user. Throws AuthenticationError (401) if missing
 * or invalid — caught by the global error middleware.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    throw new AuthenticationError('Missing or malformed Authorization header')
  }

  const token = header.slice('Bearer '.length)

  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    throw new AuthenticationError('Invalid or expired access token')
  }
}

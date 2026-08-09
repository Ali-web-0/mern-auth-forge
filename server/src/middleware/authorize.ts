import type { NextFunction, Request, Response } from 'express'
import { AuthenticationError, AuthorizationError } from '@/lib/errors.js'
import type { AccessTokenPayload } from '@/lib/tokens.js'

/**
 * Role-based access control. Must run AFTER `authenticate` — it only reads
 * req.user, it never verifies the token itself. Usage:
 *
 *   router.get('/admin/users', authenticate, authorize('admin'), listUsers)
 *
 * See: MERN_Best_Practices_Checklist.md, section 8 (authorization is a
 * separate concern from authentication — never conflate "who are you" with
 * "what are you allowed to do").
 */
export function authorize(...allowedRoles: Array<AccessTokenPayload['role']>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required')
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('You do not have permission to perform this action')
    }

    next()
  }
}

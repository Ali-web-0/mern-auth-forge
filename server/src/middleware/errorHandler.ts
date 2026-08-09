import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { BusinessError } from '@/lib/errors.js'

// Every BusinessError code that exists in lib/errors.ts must be mapped here.
// Missing an entry silently falls back to 400 instead of the status that
// actually matches the error's meaning — e.g. NotFoundError ('NOT_FOUND')
// was missing this exact mapping until an integration test caught it, which
// broke the "non-owner gets 404, not 403" ownership-scoping guarantee this
// repo is supposed to demonstrate.
const STATUS_BY_CODE: Record<string, number> = {
  AUTHENTICATION_ERROR: 401,
  AUTHORIZATION_ERROR: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
}

function statusForCode(code: string): number {
  return STATUS_BY_CODE[code] ?? 400
}

/**
 * Global Express error middleware.
 *
 * Controllers stay thin and throw: Zod validation errors from `.parse()`,
 * BusinessError subclasses from the service layer, and anything unexpected
 * all land here and get mapped to the shared ActionResult response shape
 * with the correct HTTP status. Express 5 forwards rejected promises from
 * async route handlers automatically, so no try/catch wrapper is needed
 * in each controller.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: { message: 'Invalid input', code: 'VALIDATION_ERROR', issues: err.flatten() },
    })
    return
  }

  if (err instanceof BusinessError) {
    res.status(statusForCode(err.code)).json({
      success: false,
      error: { message: err.message, code: err.code },
    })
    return
  }

  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: { message: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
  })
}

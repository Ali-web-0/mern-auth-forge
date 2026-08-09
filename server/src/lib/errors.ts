/**
 * Structured error hierarchy.
 *
 * BusinessError = an EXPECTED failure (bad password, duplicate email, not found).
 * Its `.message` is safe to send directly to the client.
 *
 * Anything that is NOT a BusinessError (a real bug, a DB outage) should never
 * leak its raw message to the client — the global error middleware masks it.
 *
 * See: MERN_Best_Practices_Checklist.md, section 7.
 */
export class BusinessError extends Error {
  code: string

  constructor(message: string, code = 'BUSINESS_ERROR') {
    super(message)
    this.name = 'BusinessError'
    this.code = code
  }
}

export class AuthorizationError extends BusinessError {
  constructor(message = 'You are not authorized to perform this action') {
    super(message, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class AuthenticationError extends BusinessError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends BusinessError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends BusinessError {
  constructor(message = 'Invalid input') {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

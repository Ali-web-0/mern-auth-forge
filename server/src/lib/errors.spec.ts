import { describe, expect, it } from 'vitest'
import { AuthenticationError, AuthorizationError, BusinessError, NotFoundError, ValidationError } from '@/lib/errors.js'

describe('error hierarchy', () => {
  it('BusinessError defaults to a generic code', () => {
    const err = new BusinessError('something went wrong')
    expect(err.code).toBe('BUSINESS_ERROR')
    expect(err).toBeInstanceOf(Error)
  })

  it.each([
    [AuthenticationError, 'AUTHENTICATION_ERROR'],
    [AuthorizationError, 'AUTHORIZATION_ERROR'],
    [NotFoundError, 'NOT_FOUND'],
    [ValidationError, 'VALIDATION_ERROR'],
  ] as const)('%s carries code %s and extends BusinessError', (ErrorClass, expectedCode) => {
    const err = new ErrorClass()
    expect(err.code).toBe(expectedCode)
    expect(err).toBeInstanceOf(BusinessError)
  })

  it('accepts a custom message', () => {
    const err = new NotFoundError('That note does not exist')
    expect(err.message).toBe('That note does not exist')
  })
})

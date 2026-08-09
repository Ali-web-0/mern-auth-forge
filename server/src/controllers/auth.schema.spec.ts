import { describe, expect, it } from 'vitest'
import { LoginSchema, RegisterSchema } from '@/controllers/auth.schema.js'

describe('RegisterSchema', () => {
  it('accepts a valid email + strong password', () => {
    const result = RegisterSchema.safeParse({ email: 'ali@example.com', password: 'Password1' })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid email', () => {
    const result = RegisterSchema.safeParse({ email: 'not-an-email', password: 'Password1' })
    expect(result.success).toBe(false)
  })

  it.each([
    ['too short', 'Pw1'],
    ['no uppercase letter', 'password1'],
    ['no number', 'Password'],
  ])('rejects a password that is %s', (_label, password) => {
    const result = RegisterSchema.safeParse({ email: 'ali@example.com', password })
    expect(result.success).toBe(false)
  })
})

describe('LoginSchema', () => {
  it('accepts any non-empty password (strength is only enforced at registration)', () => {
    const result = LoginSchema.safeParse({ email: 'ali@example.com', password: 'x' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty password', () => {
    const result = LoginSchema.safeParse({ email: 'ali@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

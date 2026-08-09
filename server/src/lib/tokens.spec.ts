import { describe, expect, it } from 'vitest'
import { generateSecureToken, hashToken, signAccessToken, verifyAccessToken } from '@/lib/tokens.js'

describe('signAccessToken / verifyAccessToken', () => {
  it('round-trips a payload', () => {
    const payload = { sub: 'user-123', email: 'ali@example.com', role: 'user' as const }

    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)

    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('throws when the token is tampered with', () => {
    const token = signAccessToken({ sub: 'user-123', email: 'ali@example.com', role: 'user' })
    expect(() => verifyAccessToken(`${token}tampered`)).toThrow()
  })
})

describe('generateSecureToken', () => {
  it('produces long, unique, hex-safe values', () => {
    const a = generateSecureToken()
    const b = generateSecureToken()

    expect(a).not.toBe(b)
    expect(a).toMatch(/^[0-9a-f]+$/)
    expect(a.length).toBeGreaterThanOrEqual(64)
  })
})

describe('hashToken', () => {
  it('is deterministic and one-way', () => {
    expect(hashToken('same-input')).toBe(hashToken('same-input'))
    expect(hashToken('input-a')).not.toBe(hashToken('input-b'))
    expect(hashToken('same-input')).not.toBe('same-input')
  })
})

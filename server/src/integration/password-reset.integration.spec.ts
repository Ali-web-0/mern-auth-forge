import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '@/app.js'

const app = createApp()

/** Pulls the raw reset token out of the mailer stub's console.log call. */
function extractTokenFromResetLink(logCalls: unknown[][]): string {
  const call = logCalls.find((args) => typeof args[0] === 'string' && args[0].includes('reset link'))
  const message = call?.[0] as string | undefined
  const match = message?.match(/token=([^\s]+)/)
  const token = match?.[1]
  if (!token) throw new Error('Reset link not found in mailer stub output')
  return token
}

describe('password reset flow', () => {
  it('gives an identical response whether or not the email exists', async () => {
    await request(app).post('/api/auth/register').send({ email: 'ali@example.com', password: 'Password1' })

    const existing = await request(app).post('/api/auth/forgot-password').send({ email: 'ali@example.com' })
    const missing = await request(app).post('/api/auth/forgot-password').send({ email: 'nobody@example.com' })

    expect(existing.status).toBe(200)
    expect(missing.status).toBe(200)
    expect(existing.body.data.message).toBe(missing.body.data.message)
  })

  it('lets a user reset their password with a valid token, then log in with the new password', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    await request(app).post('/api/auth/register').send({ email: 'reset-me@example.com', password: 'Password1' })
    await request(app).post('/api/auth/forgot-password').send({ email: 'reset-me@example.com' })

    // The OSS mailer stub logs the reset link instead of sending an email —
    // pull the raw token out of it the same way a real test would pull it
    // out of a test inbox.
    const token = extractTokenFromResetLink(logSpy.mock.calls)
    logSpy.mockRestore()

    const reset = await request(app).post('/api/auth/reset-password').send({ token, password: 'NewPassword1' })
    expect(reset.status).toBe(200)

    const oldPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-me@example.com', password: 'Password1' })
    expect(oldPasswordLogin.status).toBe(401)

    const newPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset-me@example.com', password: 'NewPassword1' })
    expect(newPasswordLogin.status).toBe(200)

    // The token is single-use — replaying it must fail.
    const replay = await request(app).post('/api/auth/reset-password').send({ token, password: 'AnotherOne1' })
    expect(replay.status).toBe(401)
  })
})

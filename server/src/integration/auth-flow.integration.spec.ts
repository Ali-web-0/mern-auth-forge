import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '@/app.js'

const app = createApp()

const credentials = { email: 'ali@example.com', password: 'Password1' }

describe('register -> login -> me -> refresh -> logout', () => {
  it('registers a new account', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.user.email).toBe(credentials.email)
    expect(res.body.data.user.role).toBe('user')
    expect(res.body.data.accessToken).toBeDefined()
    // Refresh token must never appear in the JSON body — only httpOnly cookie.
    expect(res.body.data.refreshToken).toBeUndefined()
    expect(res.headers['set-cookie']?.[0]).toMatch(/refreshToken=/)
  })

  it('rejects a duplicate email as a clean BusinessError, not a raw 500', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const res = await request(app).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ success: false, error: { message: expect.any(String), code: 'EMAIL_TAKEN' } })
  })

  it('rejects a weak password before it ever reaches the service layer', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'weak@example.com', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('logs in with correct credentials and rejects incorrect ones with the same message', async () => {
    await request(app).post('/api/auth/register').send(credentials)

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: credentials.email, password: 'WrongPass1' })
    const wrongEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: credentials.password })

    expect(wrongPassword.status).toBe(401)
    expect(wrongEmail.status).toBe(401)
    // Same message either way — never leak which one was wrong.
    expect(wrongPassword.body.error.message).toBe(wrongEmail.body.error.message)

    const ok = await request(app).post('/api/auth/login').send(credentials)
    expect(ok.status).toBe(200)
    expect(ok.body.data.user.email).toBe(credentials.email)
  })

  it('rejects /me without a token and accepts it with one', async () => {
    // Every test starts with an empty DB (see tests/integration/setup.ts
    // afterEach) — the account has to be created here, not assumed to
    // exist from an earlier test in this file.
    await request(app).post('/api/auth/register').send(credentials)

    const noToken = await request(app).get('/api/auth/me')
    expect(noToken.status).toBe(401)

    const login = await request(app).post('/api/auth/login').send(credentials)
    const accessToken = login.body.data.accessToken

    const withToken = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
    expect(withToken.status).toBe(200)
    expect(withToken.body.data.user.email).toBe(credentials.email)
  })

  it('rotates the refresh token on each /refresh call', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials)

    const first = await agent.post('/api/auth/refresh')
    const second = await agent.post('/api/auth/refresh')

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(first.headers['set-cookie']?.[0]).not.toBe(second.headers['set-cookie']?.[0])
  })

  it('detects refresh token reuse and revokes the whole family', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials)

    // Grab the raw refresh cookie so we can replay it manually below.
    const registerRes = await agent.post('/api/auth/login').send(credentials)
    const originalCookie = registerRes.headers['set-cookie']?.[0]
    expect(originalCookie).toBeDefined()

    // First refresh with the original token succeeds and rotates it.
    await request(app).post('/api/auth/refresh').set('Cookie', originalCookie as string)

    // Replaying the SAME (now-rotated-out) token is theft-reuse — must fail.
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', originalCookie as string)
    expect(replay.status).toBe(401)
    expect(replay.body.error.message).toMatch(/reuse detected/i)
  })

  it('logout revokes the current session and logout-all revokes every session', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials)

    const logout = await agent.post('/api/auth/logout')
    expect(logout.status).toBe(200)

    const refreshAfterLogout = await agent.post('/api/auth/refresh')
    expect(refreshAfterLogout.status).toBe(401)

    // logout-all requires auth and revokes everything for the user.
    const relogin = await agent.post('/api/auth/login').send(credentials)
    const logoutAll = await agent
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${relogin.body.data.accessToken}`)
    expect(logoutAll.status).toBe(200)

    const refreshAfterLogoutAll = await agent.post('/api/auth/refresh')
    expect(refreshAfterLogoutAll.status).toBe(401)
  })
})

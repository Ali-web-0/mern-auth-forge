import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '@/app.js'
import { User } from '@/models/User.model.js'

const app = createApp()

async function loginAs(email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return res.body.data.accessToken as string
}

describe('RBAC: /api/admin/users', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('rejects an authenticated non-admin user with 403', async () => {
    await request(app).post('/api/auth/register').send({ email: 'user@example.com', password: 'Password1' })
    const accessToken = await loginAs('user@example.com', 'Password1')

    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('allows an admin through and returns sanitized user data', async () => {
    await request(app).post('/api/auth/register').send({ email: 'admin@example.com', password: 'Password1' })
    // Seed the admin role directly — registration always creates 'user',
    // promoting a user to admin is deliberately out of scope for the API
    // in this boilerplate (a real app would gate that behind its own
    // admin-only endpoint or a one-off script).
    await User.updateOne({ email: 'admin@example.com' }, { role: 'admin' })

    const accessToken = await loginAs('admin@example.com', 'Password1')
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.users)).toBe(true)
    expect(res.body.data.users[0].passwordHash).toBeUndefined()
  })
})

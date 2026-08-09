import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '@/app.js'

const app = createApp()

async function registerAndLogin(email: string) {
  const password = 'Password1'
  await request(app).post('/api/auth/register').send({ email, password })
  const res = await request(app).post('/api/auth/login').send({ email, password })
  return res.body.data.accessToken as string
}

describe('ownership-scoped resource: /api/notes', () => {
  it('lets a user create and list only their own notes', async () => {
    const tokenA = await registerAndLogin('owner-a@example.com')

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Grocery list', body: 'Eggs, milk, bread' })
    expect(create.status).toBe(201)

    const list = await request(app).get('/api/notes').set('Authorization', `Bearer ${tokenA}`)
    expect(list.status).toBe(200)
    expect(list.body.data.notes).toHaveLength(1)
    expect(list.body.data.notes[0].title).toBe('Grocery list')
  })

  it("returns 404 (not 403) when a user requests another user's note", async () => {
    const tokenA = await registerAndLogin('owner-a2@example.com')
    const tokenB = await registerAndLogin('owner-b2@example.com')

    const create = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Private', body: 'Only mine' })
    const noteId = create.body.data.note.id

    const getAsB = await request(app).get(`/api/notes/${noteId}`).set('Authorization', `Bearer ${tokenB}`)
    expect(getAsB.status).toBe(404)

    const updateAsB = await request(app)
      .patch(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hijacked', body: 'Hijacked' })
    expect(updateAsB.status).toBe(404)

    const deleteAsB = await request(app).delete(`/api/notes/${noteId}`).set('Authorization', `Bearer ${tokenB}`)
    expect(deleteAsB.status).toBe(404)

    // The owner can still see it untouched — B's attempts silently matched nothing.
    const getAsA = await request(app).get(`/api/notes/${noteId}`).set('Authorization', `Bearer ${tokenA}`)
    expect(getAsA.status).toBe(200)
    expect(getAsA.body.data.note.title).toBe('Private')
  })

  it('rejects a malformed note id with a clean 400', async () => {
    const token = await registerAndLogin('owner-c@example.com')
    const res = await request(app).get('/api/notes/not-a-valid-id').set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

import type { Request, Response } from 'express'
import { ok } from '@/lib/actionResult.js'
import { listUsers } from '@/services/users/index.js'

export async function getUsers(_req: Request, res: Response) {
  const users = await listUsers()
  res.status(200).json(ok({ users }))
}

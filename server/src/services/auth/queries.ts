import { NotFoundError } from '@/lib/errors.js'
import { User } from '@/models/User.model.js'
import type { AuthenticatedUser } from '@/services/auth/types.js'

function toAuthenticatedUser(doc: { _id: unknown; email: string; role: 'user' | 'admin' }): AuthenticatedUser {
  return { id: String(doc._id), email: doc.email, role: doc.role }
}

export async function findUserByEmail(email: string) {
  return User.findOne({ email: email.toLowerCase().trim() })
}

export async function getUserById(id: string): Promise<AuthenticatedUser> {
  const user = await User.findById(id)
  if (!user) throw new NotFoundError('User not found')
  return toAuthenticatedUser(user)
}

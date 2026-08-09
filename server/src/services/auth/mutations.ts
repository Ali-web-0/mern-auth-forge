import bcrypt from 'bcryptjs'
import { env } from '@/lib/env.js'
import { AuthenticationError, BusinessError } from '@/lib/errors.js'
import { User } from '@/models/User.model.js'
import { findUserByEmail } from '@/services/auth/queries.js'
import type { AuthenticatedUser, LoginInput, RegisterInput } from '@/services/auth/types.js'

function toAuthenticatedUser(doc: { _id: unknown; email: string; role: 'user' | 'admin' }): AuthenticatedUser {
  return { id: String(doc._id), email: doc.email, role: doc.role }
}

export async function registerUser(input: RegisterInput): Promise<AuthenticatedUser> {
  const existing = await findUserByEmail(input.email)
  if (existing) {
    throw new BusinessError('An account with this email already exists', 'EMAIL_TAKEN')
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS)

  const user = await User.create({
    email: input.email.toLowerCase().trim(),
    passwordHash,
    role: 'user',
  })

  return toAuthenticatedUser(user)
}

export async function loginUser(input: LoginInput): Promise<AuthenticatedUser> {
  const user = await findUserByEmail(input.email)

  // Same error for "no such user" and "wrong password" — don't leak which one it was.
  if (!user) {
    throw new AuthenticationError('Invalid email or password')
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash)
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password')
  }

  return toAuthenticatedUser(user)
}

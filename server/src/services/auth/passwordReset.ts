import bcrypt from 'bcryptjs'
import { env } from '@/lib/env.js'
import { AuthenticationError } from '@/lib/errors.js'
import { sendPasswordResetEmail } from '@/lib/mailer.js'
import { generateSecureToken, hashToken } from '@/lib/tokens.js'
import { PasswordResetToken } from '@/models/PasswordResetToken.model.js'
import { User } from '@/models/User.model.js'
import { findUserByEmail } from '@/services/auth/queries.js'
import { revokeAllUserTokens } from '@/services/auth/refreshTokens.js'

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Always resolves the same way whether or not the email belongs to an
 * account — the controller returns an identical success response either
 * way. This prevents "forgot password" from being usable to enumerate
 * registered emails.
 * See: MERN_Best_Practices_Checklist.md, section 7.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email)
  if (!user) return

  const token = generateSecureToken()
  await PasswordResetToken.create({
    tokenHash: hashToken(token),
    userId: user._id,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  })

  const resetLink = `${env.CLIENT_ORIGIN}/reset-password?token=${token}`
  await sendPasswordResetEmail(user.email, resetLink)
}

export async function resetPassword(rawToken: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(rawToken)
  const resetToken = await PasswordResetToken.findOne({ tokenHash })

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() < Date.now()) {
    throw new AuthenticationError('This password reset link is invalid or has expired')
  }

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS)
  await User.updateOne({ _id: resetToken.userId }, { passwordHash })

  resetToken.usedAt = new Date()
  await resetToken.save()

  // Password change invalidates every existing session — force re-login
  // everywhere, in case the reset was prompted by a compromised account.
  await revokeAllUserTokens(String(resetToken.userId))
}

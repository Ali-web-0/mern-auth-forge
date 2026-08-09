import crypto from 'node:crypto'
import { env } from '@/lib/env.js'
import { AuthenticationError } from '@/lib/errors.js'
import { generateSecureToken, hashToken } from '@/lib/tokens.js'
import { RefreshToken } from '@/models/RefreshToken.model.js'
import type { IssuedRefreshToken, RotatedRefreshToken } from '@/services/auth/types.js'

function expiryDate(): Date {
  const days = env.JWT_REFRESH_EXPIRES_IN_DAYS
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

/**
 * Starts a new rotation family — called on register/login. Every token
 * produced by later rotations of this session shares `familyId`, which is
 * what lets us nuke the whole chain if reuse is ever detected.
 */
export async function issueRefreshToken(userId: string): Promise<IssuedRefreshToken> {
  const token = generateSecureToken()
  const familyId = crypto.randomUUID()
  const expiresAt = expiryDate()

  await RefreshToken.create({
    tokenHash: hashToken(token),
    userId,
    familyId,
    expiresAt,
  })

  return { token, expiresAt, familyId }
}

/**
 * Rotates a refresh token: the presented token is marked revoked and a new
 * one is issued in the same family. If the presented token was ALREADY
 * revoked, that means it's being replayed (stolen and reused, or a client
 * bug racing two refreshes) — we revoke the entire family and force the
 * user to log in again everywhere that session was active.
 * See: MERN_Best_Practices_Checklist.md, section 7.
 */
export async function rotateRefreshToken(rawToken: string): Promise<RotatedRefreshToken> {
  const tokenHash = hashToken(rawToken)
  const existing = await RefreshToken.findOne({ tokenHash })

  if (!existing) {
    throw new AuthenticationError('Invalid refresh token')
  }

  if (existing.revokedAt) {
    // Reuse of an already-rotated-out token — treat as theft.
    await revokeFamily(existing.familyId)
    throw new AuthenticationError('Refresh token reuse detected — all sessions revoked, please log in again')
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    throw new AuthenticationError('Refresh token expired')
  }

  const nextToken = generateSecureToken()
  const nextTokenHash = hashToken(nextToken)
  const expiresAt = expiryDate()

  existing.revokedAt = new Date()
  existing.replacedByHash = nextTokenHash
  await existing.save()

  await RefreshToken.create({
    tokenHash: nextTokenHash,
    userId: existing.userId,
    familyId: existing.familyId,
    expiresAt,
  })

  return { token: nextToken, expiresAt, familyId: existing.familyId, userId: String(existing.userId) }
}

/** Revokes a single token by its raw value — used on logout. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken)
  await RefreshToken.updateOne({ tokenHash, revokedAt: null }, { revokedAt: new Date() })
}

/** Revokes every non-revoked token in a family — used internally on reuse detection. */
export async function revokeFamily(familyId: string): Promise<void> {
  await RefreshToken.updateMany({ familyId, revokedAt: null }, { revokedAt: new Date() })
}

/** Revokes every non-revoked token for a user, across all devices/sessions — used on logout-all. */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() })
}

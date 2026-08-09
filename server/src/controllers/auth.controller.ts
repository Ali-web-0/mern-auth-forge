import type { Request, Response } from 'express'
import { ok } from '@/lib/actionResult.js'
import { clearRefreshTokenCookie, getRefreshTokenCookie, setRefreshTokenCookie } from '@/lib/cookies.js'
import { AuthenticationError } from '@/lib/errors.js'
import { signAccessToken } from '@/lib/tokens.js'
import {
  getUserById,
  issueRefreshToken,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  revokeAllUserTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/services/auth/index.js'
import { ForgotPasswordSchema, LoginSchema, RegisterSchema, ResetPasswordSchema } from '@/controllers/auth.schema.js'

// Controllers stay thin: parse input, call the service layer, shape the
// response. Business errors thrown by the service layer propagate to the
// global error middleware (server/src/middleware/errorHandler.ts), which
// maps them to the correct HTTP status and the shared ActionResult shape.
// See: MERN_Best_Practices_Checklist.md, section 4.

export async function register(req: Request, res: Response) {
  const input = RegisterSchema.parse(req.body)
  const user = await registerUser(input)
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = await issueRefreshToken(user.id)
  setRefreshTokenCookie(res, refreshToken.token, refreshToken.expiresAt)

  res.status(201).json(ok({ user, accessToken }))
}

export async function login(req: Request, res: Response) {
  const input = LoginSchema.parse(req.body)
  const user = await loginUser(input)
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
  const refreshToken = await issueRefreshToken(user.id)
  setRefreshTokenCookie(res, refreshToken.token, refreshToken.expiresAt)

  res.status(200).json(ok({ user, accessToken }))
}

export async function me(req: Request, res: Response) {
  // authenticate middleware guarantees req.user is set before this runs.
  if (!req.user) {
    throw new AuthenticationError('Not authenticated')
  }

  const user = await getUserById(req.user.sub)
  res.status(200).json(ok({ user }))
}

export async function refresh(req: Request, res: Response) {
  const rawToken = getRefreshTokenCookie(req.cookies)
  if (!rawToken) {
    throw new AuthenticationError('Missing refresh token')
  }

  const rotated = await rotateRefreshToken(rawToken)
  const user = await getUserById(rotated.userId)
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })
  setRefreshTokenCookie(res, rotated.token, rotated.expiresAt)

  res.status(200).json(ok({ user, accessToken }))
}

export async function logout(req: Request, res: Response) {
  const rawToken = getRefreshTokenCookie(req.cookies)
  if (rawToken) {
    await revokeRefreshToken(rawToken)
  }
  clearRefreshTokenCookie(res)

  res.status(200).json(ok({ loggedOut: true }))
}

export async function logoutAll(req: Request, res: Response) {
  if (!req.user) {
    throw new AuthenticationError('Not authenticated')
  }

  await revokeAllUserTokens(req.user.sub)
  clearRefreshTokenCookie(res)

  res.status(200).json(ok({ loggedOut: true }))
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = ForgotPasswordSchema.parse(req.body)
  await requestPasswordReset(email)

  // Identical response regardless of whether the email exists — see
  // services/auth/passwordReset.ts for why.
  res.status(200).json(ok({ message: 'If an account exists for that email, a reset link has been sent.' }))
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const { token, password } = ResetPasswordSchema.parse(req.body)
  await resetPassword(token, password)

  res.status(200).json(ok({ message: 'Password updated. Please log in again.' }))
}

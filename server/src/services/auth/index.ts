// Public barrel — import auth service functions ONLY from here, never reach
// into queries.ts / mutations.ts directly from outside this folder.
// See: MERN_Best_Practices_Checklist.md, section 2.

export { loginUser, registerUser } from '@/services/auth/mutations.js'
export { requestPasswordReset, resetPassword } from '@/services/auth/passwordReset.js'
export { getUserById } from '@/services/auth/queries.js'
export {
  issueRefreshToken,
  revokeAllUserTokens,
  revokeRefreshToken,
  rotateRefreshToken,
} from '@/services/auth/refreshTokens.js'
export type {
  AuthenticatedUser,
  IssuedRefreshToken,
  LoginInput,
  RegisterInput,
  RotatedRefreshToken,
} from '@/services/auth/types.js'

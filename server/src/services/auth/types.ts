export interface RegisterInput {
  email: string
  password: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'user' | 'admin'
}

export interface IssuedRefreshToken {
  token: string // raw token — only ever returned once, at issue time
  expiresAt: Date
  familyId: string
}

export interface RotatedRefreshToken extends IssuedRefreshToken {
  userId: string
}

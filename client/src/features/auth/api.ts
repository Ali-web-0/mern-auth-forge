import { apiFetch, setAccessToken } from '@/lib/api'
import type { ForgotPasswordFormValues, LoginFormValues, RegisterFormValues } from '@/lib/auth.schema'
import type { User } from '@/types/auth'

interface AuthResponse {
  user: User
  accessToken: string
}

export async function registerRequest(input: RegisterFormValues): Promise<User> {
  const data = await apiFetch<AuthResponse>('/auth/register', { method: 'POST', body: input })
  setAccessToken(data.accessToken)
  return data.user
}

export async function loginRequest(input: LoginFormValues): Promise<User> {
  const data = await apiFetch<AuthResponse>('/auth/login', { method: 'POST', body: input })
  setAccessToken(data.accessToken)
  return data.user
}

export async function meRequest(): Promise<User> {
  const data = await apiFetch<{ user: User }>('/auth/me')
  return data.user
}

export async function logoutRequest(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' })
  setAccessToken(null)
}

export async function logoutAllRequest(): Promise<void> {
  await apiFetch('/auth/logout-all', { method: 'POST' })
  setAccessToken(null)
}

export async function forgotPasswordRequest(input: ForgotPasswordFormValues): Promise<{ message: string }> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: input })
}

export async function resetPasswordRequest(token: string, password: string): Promise<{ message: string }> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: { token, password } })
}

import { apiFetch } from '@/lib/api'

export interface AdminUser {
  id: string
  email: string
  role: 'user' | 'admin'
  createdAt: string
}

export async function listUsersRequest(): Promise<AdminUser[]> {
  const data = await apiFetch<{ users: AdminUser[] }>('/admin/users')
  return data.users
}

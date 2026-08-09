export interface UserSummary {
  id: string
  email: string
  role: 'user' | 'admin'
  createdAt: Date
}

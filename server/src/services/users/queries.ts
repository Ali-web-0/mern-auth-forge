import { User } from '@/models/User.model.js'
import type { UserSummary } from '@/services/users/types.js'

/**
 * Example admin-only query — deliberately excludes passwordHash. This is
 * the "vertical slice" pattern from the checklist: a new resource gets its
 * own services/<name>/ folder (types, queries, mutations, barrel) rather
 * than growing the auth slice indefinitely.
 * See: MERN_Best_Practices_Checklist.md, section 2.
 */
export async function listUsers(): Promise<UserSummary[]> {
  const users = await User.find().select('email role createdAt').sort({ createdAt: -1 })

  return users.map((user) => ({
    id: String(user._id),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }))
}

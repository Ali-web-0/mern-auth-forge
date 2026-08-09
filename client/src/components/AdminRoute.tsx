import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Same shape as ProtectedRoute, plus a role check. This is a UX guard only
// — it hides the page for non-admins, it doesn't grant access. The actual
// security boundary is server-side: GET /api/admin/users is protected by
// the authorize('admin') middleware regardless of what this component does.
// See: server/src/middleware/authorize.ts.
export function AdminRoute({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

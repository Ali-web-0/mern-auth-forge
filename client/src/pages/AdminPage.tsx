import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/card'
import { listUsersRequest } from '@/features/admin/api'

export function AdminPage() {
  const usersQuery = useQuery({ queryKey: ['admin', 'users'], queryFn: listUsersRequest })

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Admin panel</h1>
          <p className="text-sm text-muted-foreground">
            Example RBAC-protected route — visible only to users with role "admin".
          </p>
        </div>
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users</CardTitle>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading && <p className="text-sm text-muted-foreground">Loading users…</p>}
          {usersQuery.isError && (
            <p className="text-sm text-destructive">
              Couldn't load users — this page only works if the server actually granted you the admin role.
            </p>
          )}

          {usersQuery.data && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {usersQuery.data.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          user.role === 'admin'
                            ? 'rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground'
                            : 'rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground'
                        }
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

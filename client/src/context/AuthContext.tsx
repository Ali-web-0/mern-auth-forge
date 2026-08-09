import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext } from 'react'
import { meRequest } from '@/features/auth/api'
import type { User } from '@/types/auth'

interface AuthContextValue {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

// A single `me` query is the source of truth for "who is logged in." The
// login/register/logout hooks (hooks/useLogin.ts, useRegister.ts,
// useLogout.ts) write straight into this query's cache instead of forcing
// a refetch, so the UI updates instantly on auth state changes.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: meRequest,
    retry: false,
  })

  const value: AuthContextValue = {
    user: data ?? null,
    status: isLoading ? 'loading' : data ? 'authenticated' : 'unauthenticated',
    refetchUser: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return ctx
}

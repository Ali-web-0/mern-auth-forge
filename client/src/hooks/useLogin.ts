import { useMutation, useQueryClient } from '@tanstack/react-query'
import { loginRequest } from '@/features/auth/api'
import type { LoginFormValues } from '@/lib/auth.schema'
import type { User } from '@/types/auth'

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginFormValues) => loginRequest(input),
    onSuccess: (user: User) => {
      // Write directly into the cache the me-query reads from — no extra
      // round trip to /auth/me right after login.
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}

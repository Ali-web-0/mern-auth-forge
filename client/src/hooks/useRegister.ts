import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerRequest } from '@/features/auth/api'
import type { RegisterFormValues } from '@/lib/auth.schema'
import type { User } from '@/types/auth'

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegisterFormValues) => registerRequest(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData(['auth', 'me'], user)
    },
  })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logoutAllRequest, logoutRequest } from '@/features/auth/api'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })
}

export function useLogoutAll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => logoutAllRequest(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null)
    },
  })
}

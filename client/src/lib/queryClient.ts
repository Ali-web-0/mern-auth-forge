import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't burn retries on 401/403/404 — those won't fix themselves.
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          return false
        }
        return failureCount < 2
      },
      staleTime: 30_000,
    },
  },
})

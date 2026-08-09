import type { ActionResult } from '@/lib/actionResult'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'

// The access token lives in memory only — never localStorage/sessionStorage,
// so an XSS bug can't read it off disk. It's lost on a hard refresh by
// design; the app recovers it on load by calling /auth/refresh once (the
// httpOnly refresh cookie survives the refresh). See AuthProvider.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

export class ApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

// Refresh calls can be triggered concurrently by several in-flight requests
// that all 401 around the same time — share one in-flight promise instead
// of firing multiple refresh requests (and multiple token rotations) at once.
let refreshPromise: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (!res.ok) return false

        const body = (await res.json()) as ActionResult<{ accessToken: string }>
        if (!body.success) return false

        setAccessToken(body.data.accessToken)
        return true
      } catch {
        return false
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  /** Internal — prevents infinite retry loops. */
  _retried?: boolean
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, _retried, headers, ...rest } = options

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  // Access token expired mid-session — try one silent refresh, then retry
  // the original request exactly once.
  if (res.status === 401 && !_retried && path !== '/auth/refresh' && path !== '/auth/login') {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true })
    }
  }

  const result = (await res.json()) as ActionResult<T>

  if (!result.success) {
    throw new ApiError(result.error.message, result.error.code, res.status)
  }

  return result.data
}

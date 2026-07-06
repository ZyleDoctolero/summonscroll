import { useUserStore } from '@/stores/userStore'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// ── Token refresh singleton ───────────────────────────────────────────────────
// Holds the in-flight refresh promise so concurrent 401s queue behind one call
let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      // Retrieve the refresh token from persisted Zustand state
      const stored = localStorage.getItem('summonscroll-user')
      let refreshToken: string | null = null
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { state?: { accessToken?: string } }
          // The refresh token is not persisted in the store for security;
          // we rely on the server's refresh endpoint accepting the stored accessToken
          // to issue a new pair. The actual refreshToken is sent via the body.
          void parsed
        } catch { /* ignore */ }
      }

      // Fall back: read refreshToken from a dedicated key if stored separately
      refreshToken = sessionStorage.getItem('summonscroll-refresh') ?? null

      if (!refreshToken) return null

      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        useUserStore.getState().logout()
        return null
      }

      const body = (await response.json()) as {
        data: { accessToken: string; refreshToken: string; expiresIn: number }
      }
      const tokens = body.data
      useUserStore.getState().setTokens(tokens)
      return tokens.accessToken
    } catch {
      useUserStore.getState().logout()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// ── Core request function ─────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const token = useUserStore.getState().accessToken

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register')

  // ── 401 handling: attempt one token refresh then retry (skip for auth routes) ────
  if (response.status === 401 && !isRetry && !isAuthRoute) {
    const newToken = await refreshAccessToken()
    if (!newToken) {
      // Refresh failed — user is logged out, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
      throw new ApiError(401, 'Session expired. Please log in again.')
    }
    // Retry the original request with the new token
    return request<T>(path, options, true)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: response.statusText }))
    throw new ApiError(response.status, body.message ?? 'Request failed')
  }

  // 204 No Content
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export { ApiError }

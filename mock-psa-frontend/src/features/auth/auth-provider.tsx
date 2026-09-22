import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import {
  requestAuthenticatedUser,
  requestToken,
  SessionRejectedError,
} from "@/features/auth/auth-api"
import {
  AuthContext,
  type AuthContextValue,
} from "@/features/auth/auth-context"
import { AUTH_TOKEN_STORAGE_KEY } from "@/features/auth/auth-storage"
import type { AuthenticatedUser, SessionStatus } from "@/features/auth/types"

function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    )
    const claims = JSON.parse(atob(padded)) as { exp?: unknown }
    return typeof claims.exp === "number" ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [status, setStatus] = useState<SessionStatus>(() =>
    window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      ? "checking"
      : "unauthenticated",
  )
  const validationId = useRef(0)

  const signOut = useCallback(() => {
    validationId.current += 1
    window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const validateStoredSession = useCallback(async () => {
    const token = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!token) return

    const requestId = ++validationId.current
    try {
      const authenticatedUser = await requestAuthenticatedUser(token)
      if (requestId !== validationId.current) return
      setUser(authenticatedUser)
      setStatus("authenticated")
    } catch (error) {
      if (requestId !== validationId.current) return
      setUser(null)
      if (error instanceof SessionRejectedError) {
        window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
        setStatus("unauthenticated")
      } else {
        setStatus("unavailable")
      }
    }
  }, [])

  useEffect(() => {
    if (!window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)) return
    const timeout = window.setTimeout(() => void validateStoredSession(), 0)
    return () => window.clearTimeout(timeout)
  }, [validateStoredSession])

  useEffect(() => {
    if (status !== "authenticated") return
    const token = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
    if (!token) return
    const expiresAt = getTokenExpiration(token)
    if (expiresAt === null) return
    const remaining = expiresAt - Date.now()
    const timeout = window.setTimeout(
      signOut,
      Math.min(Math.max(remaining, 0), 2_147_483_647),
    )
    return () => window.clearTimeout(timeout)
  }, [signOut, status])

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await requestToken(email, password)
    const authenticatedUser = await requestAuthenticatedUser(token)
    validationId.current += 1
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    setUser(authenticatedUser)
    setStatus("authenticated")
  }, [])

  const authenticatedFetch = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const token = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
      if (!token) {
        signOut()
        throw new SessionRejectedError("No authenticated session")
      }
      const headers = new Headers(init.headers)
      headers.set("Authorization", `Bearer ${token}`)
      const response = await fetch(`/api${path}`, { ...init, headers })
      if (response.status === 401) signOut()
      return response
    },
    [signOut],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      signIn,
      signOut,
      retrySessionValidation: () => {
        setStatus("checking")
        void validateStoredSession()
      },
      authenticatedFetch,
    }),
    [authenticatedFetch, signIn, signOut, status, user, validateStoredSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

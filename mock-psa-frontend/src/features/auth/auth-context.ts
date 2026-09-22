import { createContext, useContext } from "react"

import type { AuthenticatedUser, SessionStatus } from "@/features/auth/types"

export type AuthContextValue = {
  user: AuthenticatedUser | null
  status: SessionStatus
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  retrySessionValidation: () => void
  authenticatedFetch: (path: string, init?: RequestInit) => Promise<Response>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within an AuthProvider")
  return context
}

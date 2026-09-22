export type AuthenticatedUser = {
  id: number
  email: string
  role: string
}

export type SessionStatus =
  "checking" | "authenticated" | "unauthenticated" | "unavailable"

export type TokenResponse = {
  access_token: string
  token_type: string
}

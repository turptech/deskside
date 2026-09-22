import type { AuthenticatedUser, TokenResponse } from "@/features/auth/types"

const API_BASE = "/api"

export class AuthenticationError extends Error {}

export class SessionRejectedError extends Error {}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== "object") return false
  const user = value as Record<string, unknown>
  return (
    typeof user.id === "number" &&
    typeof user.email === "string" &&
    typeof user.role === "string"
  )
}

function isTokenResponse(value: unknown): value is TokenResponse {
  if (!value || typeof value !== "object") return false
  const token = value as Record<string, unknown>
  return (
    typeof token.access_token === "string" &&
    token.access_token.length > 0 &&
    token.token_type === "bearer"
  )
}

export async function requestToken(
  email: string,
  password: string,
): Promise<string> {
  const body = new URLSearchParams({ username: email.trim(), password })
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })

  if (!response.ok) throw new AuthenticationError("Login was rejected")

  const payload: unknown = await response.json()
  if (!isTokenResponse(payload)) {
    throw new AuthenticationError("Login response was invalid")
  }
  return payload.access_token
}

export async function requestAuthenticatedUser(
  token: string,
  signal?: AbortSignal,
): Promise<AuthenticatedUser> {
  const response = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  })

  if (response.status === 401) {
    throw new SessionRejectedError("Session was rejected")
  }
  if (!response.ok) throw new Error("Session service is unavailable")

  const payload: unknown = await response.json()
  if (!isAuthenticatedUser(payload)) {
    throw new Error("Session response was invalid")
  }
  return payload
}

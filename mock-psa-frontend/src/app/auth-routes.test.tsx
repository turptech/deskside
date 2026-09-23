import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/features/auth/auth-context"
import { AuthProvider } from "@/features/auth/auth-provider"
import { AUTH_TOKEN_STORAGE_KEY } from "@/features/auth/auth-storage"

const authenticatedUser = {
  id: 1,
  email: "tech@example.com",
  role: "technician",
}

function makeToken(expiresAt = Date.now() + 30 * 60 * 1000) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(expiresAt / 1000) }))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
  return `header.${payload}.signature`
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  })
}

function renderRoute(path: string) {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="deskside-test-theme">
      <AuthProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[path]}>
            <AppRoutes />
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>,
  )
}

function AuthenticatedRequestProbe() {
  const { authenticatedFetch, status } = useAuth()
  return (
    <div>
      <p>{status}</p>
      <button onClick={() => void authenticatedFetch("/tickets")}>
        Call protected API
      </button>
    </div>
  )
}

function renderRequestProbe() {
  return render(
    <AuthProvider>
      <AuthenticatedRequestProbe />
    </AuthProvider>,
  )
}

function mockValidStoredSession(token = makeToken()) {
  window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
  vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(authenticatedUser))
  return token
}

describe("authentication routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.stubGlobal("fetch", vi.fn())
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("submits OAuth2 form data, validates the user, and opens Tickets", async () => {
    const user = userEvent.setup()
    const token = makeToken()
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ access_token: token, token_type: "bearer" }),
      )
      .mockResolvedValueOnce(jsonResponse(authenticatedUser))
    renderRoute("/login")

    await user.type(screen.getByLabelText("Email"), "tech@example.com")
    await user.type(screen.getByLabelText("Password"), "safe-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(
      await screen.findByRole("heading", { name: "Ticket queue" }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(token)
    const [loginUrl, loginInit] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(loginUrl).toBe("/api/login")
    expect(loginInit).toMatchObject({
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    expect(loginInit?.body?.toString()).toBe(
      "username=tech%40example.com&password=safe-password",
    )
    expect(vi.mocked(fetch)).toHaveBeenNthCalledWith(
      2,
      "/api/me",
      expect.objectContaining({
        headers: { Authorization: `Bearer ${token}` },
      }),
    )
  })

  it("shows one generic error and clears the password after failed login", async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    renderRoute("/login")

    await user.type(screen.getByLabelText("Email"), "tech@example.com")
    await user.type(screen.getByLabelText("Password"), "wrong")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to sign in. Check your credentials and try again.",
    )
    expect(screen.getByLabelText("Password")).toHaveValue("")
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it("disables credentials and announces progress while signing in", async () => {
    const user = userEvent.setup()
    let resolveLogin!: (response: Response) => void
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise((resolve) => (resolveLogin = resolve)),
    )
    renderRoute("/login")

    await user.type(screen.getByLabelText("Email"), "tech@example.com")
    await user.type(screen.getByLabelText("Password"), "safe-password")
    await user.click(screen.getByRole("button", { name: "Sign in" }))

    expect(screen.getByLabelText("Email")).toBeDisabled()
    expect(screen.getByLabelText("Password")).toBeDisabled()
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled()
    resolveLogin(new Response(null, { status: 401 }))
    expect(await screen.findByRole("alert")).toBeVisible()
  })

  it("restores a valid tab session and redirects authenticated login visits", async () => {
    mockValidStoredSession()
    renderRoute("/login")

    expect(
      await screen.findByRole("heading", { name: "Ticket queue" }),
    ).toBeVisible()
    expect(screen.queryByRole("heading", { name: "Welcome back" })).toBeNull()
  })

  it("shows a neutral loading state while a stored session is checked", () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, makeToken())
    vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined))
    renderRoute("/tickets")

    expect(
      screen.getByRole("heading", { name: "Checking your session" }),
    ).toBeVisible()
  })

  it.each([
    "/",
    "/tickets/1048",
    "/companies/1",
    "/sites/1",
    "/contacts/1",
    "/assets/1",
    "/knowledge-articles/1",
    "/does-not-exist",
  ])("redirects unauthenticated access to %s into Login", async (path) => {
    renderRoute(path)
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeVisible()
    expect(screen.queryByText("DeskSide Assistant")).toBeNull()
  })

  it("clears a rejected stored session and redirects to Login", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "rejected-token")
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    renderRoute("/tickets")

    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
  })

  it("keeps a saved session on service failure and retries validation", async () => {
    const user = userEvent.setup()
    const token = makeToken()
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token)
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError("offline"))
      .mockResolvedValueOnce(jsonResponse(authenticatedUser))
    renderRoute("/tickets")

    expect(
      await screen.findByRole("heading", {
        name: "Unable to verify session",
      }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBe(token)
    await user.click(screen.getByRole("button", { name: "Try again" }))
    expect(
      await screen.findByRole("heading", { name: "Ticket queue" }),
    ).toBeVisible()
  })

  it("invalidates the session when an authenticated request returns 401", async () => {
    const user = userEvent.setup()
    const token = makeToken()
    mockValidStoredSession(token)
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    renderRequestProbe()

    expect(await screen.findByText("authenticated")).toBeVisible()
    await user.click(screen.getByRole("button", { name: "Call protected API" }))
    expect(await screen.findByText("unauthenticated")).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
    expect(vi.mocked(fetch)).toHaveBeenLastCalledWith(
      "/api/tickets",
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it("redirects when the live ticket queue rejects a restored session", async () => {
    const token = mockValidStoredSession()
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }))
    renderRoute("/tickets")

    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/tickets?offset=0&limit=100",
      expect.anything(),
    )
    expect(token).toBeTruthy()
  })

  it("logs out from the sidebar account menu", async () => {
    const user = userEvent.setup()
    mockValidStoredSession()
    renderRoute("/tickets")

    await user.click(
      await screen.findByRole("button", {
        name: "Open account menu for tech@example.com",
      }),
    )
    const menu = await screen.findByRole("menu")
    expect(within(menu).getByText("Technician")).toBeVisible()
    await user.click(within(menu).getByRole("menuitem", { name: "Log out" }))

    expect(
      await screen.findByRole("heading", { name: "You’re signed out" }),
    ).toBeVisible()
    expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull()
    expect(
      screen.getByRole("link", { name: "Return to login" }),
    ).toHaveAttribute("href", "/login")
  })

  it("clears a stored session when Logout is opened directly", async () => {
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, makeToken())
    vi.mocked(fetch).mockImplementation(() => new Promise(() => undefined))
    renderRoute("/logout")

    expect(
      screen.getByRole("heading", { name: "You’re signed out" }),
    ).toBeVisible()
    await waitFor(() =>
      expect(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)).toBeNull(),
    )
  })
})

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "tech@example.com", role: "technician" },
    status: "authenticated",
    signIn: vi.fn(),
    signOut: vi.fn(),
    retrySessionValidation: vi.fn(),
    authenticatedFetch: (path: string, init?: RequestInit) =>
      fetch(`/api${path}`, init),
  }),
}))

function renderRoute(path: string) {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="deskside-test-theme">
      <TooltipProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </TooltipProvider>
    </ThemeProvider>,
  )
}

describe("knowledge article routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("renders the searchable library and enables Knowledge navigation", () => {
    renderRoute("/knowledge-articles")
    expect(
      screen.getByRole("heading", { name: "Knowledge library", level: 1 }),
    ).toBeVisible()
    expect(
      screen.getByRole("table", { name: "Knowledge article directory" }),
    ).toBeVisible()
    expect(screen.getByText("Showing 6 of 6 articles")).toBeVisible()
    expect(screen.getByRole("link", { name: "Knowledge" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Knowledge" })).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(
      screen.getByRole("link", {
        name: "Open article #5: Office VPN gateway session diagnostics",
      }),
    ).toHaveAttribute("href", "/knowledge-articles/5")
    expect(
      screen.getByRole("complementary", { name: "DeskSide Assistant" }),
    ).toBeVisible()
  })

  it("searches ID, title, body, and target name with a clear no-results state", async () => {
    const user = userEvent.setup()
    renderRoute("/knowledge-articles")
    const search = screen.getByRole("textbox", {
      name: "Search knowledge articles",
    })
    for (const query of [
      "5",
      "session diagnostics",
      "tunnel renegotiation",
      "Office VPN gateway",
    ]) {
      await user.clear(search)
      await user.type(search, query)
      expect(
        screen.getByRole("link", {
          name: "Open article #5: Office VPN gateway session diagnostics",
        }),
      ).toBeVisible()
    }
    await user.clear(search)
    await user.type(search, "not in this library")
    expect(
      screen.getByRole("heading", { name: "No articles found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear article filters" }),
    )
    expect(screen.getByText("Showing 6 of 6 articles")).toBeVisible()
  })

  it("filters by direct target type and combines the filter with search", async () => {
    const user = userEvent.setup()
    renderRoute("/knowledge-articles")
    await user.click(
      screen.getByRole("combobox", { name: "Filter articles by target type" }),
    )
    await user.click(screen.getByRole("option", { name: "Company" }))
    expect(screen.getByText("Showing 2 of 6 articles")).toBeVisible()
    const search = screen.getByRole("textbox", {
      name: "Search knowledge articles",
    })
    await user.type(search, "Northstar")
    expect(
      screen.getByRole("link", {
        name: "Open article #2: Northstar remote access handoff",
      }),
    ).toBeVisible()
    expect(screen.getByText("Showing 1 of 6 articles")).toBeVisible()
    await user.clear(search)
    await user.type(search, "Branch practice")
    expect(
      screen.getByRole("heading", { name: "No articles found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear article filters" }),
    )
    expect(screen.getByText("Showing 6 of 6 articles")).toBeVisible()
  })

  it("renders title, full plain-text body, UTC timestamps, and the general state", () => {
    renderRoute("/knowledge-articles/1")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", {
        name: "First-response troubleshooting checklist",
        level: 1,
      }),
    ).toBeVisible()
    expect(
      within(main).getByText("Article ID").nextElementSibling,
    ).toHaveTextContent("#1")
    expect(
      within(main).getByText("Created").nextElementSibling,
    ).toHaveTextContent("Sep 8, 2026, 1:00 PM UTC")
    expect(
      within(main).getByText("Updated").nextElementSibling,
    ).toHaveTextContent("Sep 15, 2026, 9:00 AM UTC")
    expect(
      within(main).getByText("Target type").nextElementSibling,
    ).toHaveTextContent("General")
    expect(
      within(main).getByText("Target", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("Available across the workspace")
    const body = main.querySelector(".whitespace-pre-wrap")
    expect(body?.textContent).toBe(knowledgeArticleFixtures[0]?.body)
    expect(body?.textContent).toContain("< and >")
    expect(body?.querySelector("script, strong, em")).not.toBeInTheDocument()
    expect(
      screen.getByText("Knowledge article", { selector: "p" }),
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "Knowledge" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it.each([
    [2, "Northstar Architecture", "/companies/1", "Company"],
    [3, "Branch practice", "/sites/5", "Site"],
    [4, "Robin Carter", "/contacts/7", "Contact"],
    [5, "Office VPN gateway", "/assets/1", "Asset"],
  ] as [number, string, string, string][])(
    "links article #%s to its one %s target",
    (id, name, href, type) => {
      renderRoute(`/knowledge-articles/${id}`)
      const main = screen.getByRole("main")
      expect(
        within(main).getByText("Target type").nextElementSibling,
      ).toHaveTextContent(type)
      expect(within(main).getByRole("link", { name })).toHaveAttribute(
        "href",
        href,
      )
    },
  )

  it("navigates from the directory to detail and back, resetting center scroll", async () => {
    const user = userEvent.setup()
    renderRoute("/knowledge-articles")
    const main = screen.getByRole("main")
    main.scrollTop = 300
    await user.click(
      within(main).getByRole("link", {
        name: "Open article #5: Office VPN gateway session diagnostics",
      }),
    )
    expect(
      within(main).getByRole("heading", {
        name: "Office VPN gateway session diagnostics",
        level: 1,
      }),
    ).toBeVisible()
    expect(main.scrollTop).toBe(0)
    await user.click(
      within(main).getByRole("link", { name: "Back to knowledge" }),
    )
    expect(
      screen.getByRole("heading", { name: "Knowledge library", level: 1 }),
    ).toBeVisible()
  })

  it.each(["9999", "not-a-number", "1.5", "01", "0"])(
    "handles invalid article ID %s inside the shell",
    (id) => {
      renderRoute(`/knowledge-articles/${id}`)
      expect(
        screen.getByRole("heading", { name: "Article not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("link", { name: "Back to knowledge" }),
      ).toHaveAttribute("href", "/knowledge-articles")
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
    },
  )

  it("opens Knowledge navigation and the disconnected assistant sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/knowledge-articles/1")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("link", { name: "Knowledge" }),
    ).toHaveAttribute("data-active", "true")
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    expect(
      within(await screen.findByRole("dialog")).getByText(
        "Agent service disconnected",
      ),
    ).toBeVisible()
  })

  it("opens the Knowledge library from mobile navigation and closes the sheet", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets")
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    await user.click(await screen.findByRole("link", { name: "Knowledge" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Sidebar" }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("heading", { name: "Knowledge library", level: 1 }),
    ).toBeVisible()
  })
})

import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

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

describe("site routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("renders a direct Site URL with profile fields and only assigned tickets", () => {
    renderRoute("/sites/1")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", { name: "Raleigh office", level: 1 }),
    ).toBeVisible()
    expect(
      within(main).getByText("Site ID").nextElementSibling,
    ).toHaveTextContent("#1")
    expect(
      within(main).getByText("Address").nextElementSibling,
    ).toHaveTextContent("120 Example Avenue, Raleigh, NC")
    expect(
      within(main).getByText("Country code").nextElementSibling,
    ).toHaveTextContent("US")
    expect(
      within(main).getByText("Phone").nextElementSibling,
    ).toHaveTextContent("(919) 555-0101")
    expect(
      within(main).getByText("Timezone").nextElementSibling,
    ).toHaveTextContent("America/New_York")
    expect(
      within(main).getByRole("link", { name: "Northstar Architecture" }),
    ).toHaveAttribute("href", "/companies/1")
    const tickets = within(main).getByRole("table", { name: "Site tickets" })
    expect(
      within(main).getByRole("link", { name: "Open contact #1: Morgan Lee" }),
    ).toHaveAttribute("href", "/contacts/1")
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1048/ }),
    ).toBeVisible()
    expect(
      within(tickets).queryByRole("link", { name: /Open ticket #1043/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Site details", { selector: "p" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Companies" })).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(screen.getByRole("link", { name: "Tickets" })).toHaveAttribute(
      "data-active",
      "false",
    )
    expect(
      screen.queryByRole("link", { name: "Sites" }),
    ).not.toBeInTheDocument()
  })

  it("navigates from company to site and back, resetting center scroll", async () => {
    const user = userEvent.setup()
    renderRoute("/companies/1")
    const main = screen.getByRole("main")
    const link = within(main).getByRole("link", {
      name: "Open site #1: Raleigh office",
    })
    expect(link).toHaveAttribute("href", "/sites/1")
    expect(
      within(main).getByRole("link", { name: "Open site #6: Durham studio" }),
    ).toBeVisible()
    main.scrollTop = 300
    await user.click(link)
    expect(
      within(main).getByRole("heading", { name: "Raleigh office", level: 1 }),
    ).toBeVisible()
    expect(main.scrollTop).toBe(0)
    await user.click(
      within(main).getByRole("link", { name: "Back to company" }),
    )
    expect(
      within(main).getByRole("heading", {
        name: "Northstar Architecture",
        level: 1,
      }),
    ).toBeVisible()
  })

  it("links from a ticket to its site and preserves Not linked on other tickets", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets/1048")
    const siteLink = await within(screen.getByRole("main")).findByRole("link", {
      name: "Raleigh office",
    })
    expect(siteLink).toHaveAttribute("href", "/sites/1")
    await user.click(siteLink)
    expect(
      screen.getByRole("heading", { name: "Raleigh office", level: 1 }),
    ).toBeVisible()
  })

  it("keeps an unlinked ticket site display-only", async () => {
    renderRoute("/tickets/1045")
    const main = screen.getByRole("main")
    await within(main).findByText("Site")
    expect(within(main).getByText("Site").nextElementSibling).toHaveTextContent(
      "Not linked",
    )
    expect(
      within(main).queryByRole("link", { name: /practice|office|warehouse/i }),
    ).not.toBeInTheDocument()
  })

  it("shows missing fields and an empty ticket state for the unlinked demo site", () => {
    renderRoute("/sites/6")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", { name: "Durham studio", level: 1 }),
    ).toBeVisible()
    expect(
      within(main).getByText("Address").nextElementSibling,
    ).toHaveTextContent("88 Sample Street, Suite 200, Durham, NC 27701")
    expect(
      within(main).getByText("Phone").nextElementSibling,
    ).toHaveTextContent("Not provided")
    expect(
      within(main).getByText(
        "No tickets assigned to this site in this demo sample.",
      ),
    ).toBeVisible()
    expect(
      within(main).getByRole("link", { name: "Open contact #8: Dana Ellis" }),
    ).toHaveAttribute("href", "/contacts/8")
    expect(
      within(main).queryByRole("table", { name: "Site tickets" }),
    ).not.toBeInTheDocument()
  })

  it("does not infer assigned contacts from tickets at another site", () => {
    renderRoute("/sites/5")
    const main = screen.getByRole("main")
    expect(
      within(main).getByText(
        "No contacts assigned to this site in this demo sample.",
      ),
    ).toBeVisible()
    expect(
      within(main).getByRole("table", { name: "Site tickets" }),
    ).toHaveTextContent("Priya Shah")
  })

  it.each(["9999", "not-a-number", "1.5", "01", "0"])(
    "handles invalid Site ID %s inside the shell",
    (id) => {
      renderRoute(`/sites/${id}`)
      expect(
        screen.getByRole("heading", { name: "Site not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("link", { name: "Back to companies" }),
      ).toHaveAttribute("href", "/companies")
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
    },
  )

  it("opens navigation and the disconnected assistant sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/sites/1")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("link", { name: "Companies" }),
    ).toHaveAttribute("data-active", "true")
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Agent service disconnected")).toBeVisible()
  })
})

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
    authenticatedFetch: vi.fn(),
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

describe("company routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("renders the company directory with live navigation and sample counts", () => {
    renderRoute("/companies")
    expect(
      screen.getByRole("heading", { name: "Companies", level: 1 }),
    ).toBeVisible()
    expect(screen.getByText("Showing 6 of 6 companies")).toBeVisible()
    expect(screen.getByRole("link", { name: "Companies" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Tickets" })).not.toHaveAttribute(
      "aria-current",
    )
    expect(
      screen.getByRole("link", {
        name: "Open company #1: Northstar Architecture",
      }),
    ).toHaveAttribute("href", "/companies/1")
    expect(
      screen.getByRole("link", {
        name: "Open company #6: Summit Design Studio",
      }),
    ).toBeVisible()
    expect(screen.getByText("Company directory")).toBeVisible()
    expect(
      screen.getByRole("complementary", { name: "DeskSide Assistant" }),
    ).toBeVisible()
  })

  it("searches by name or ID, reports no results, and clears the search", async () => {
    const user = userEvent.setup()
    renderRoute("/companies")
    const search = screen.getByRole("textbox", { name: "Search companies" })

    await user.type(search, "Northstar")
    expect(screen.getByText("Showing 1 of 6 companies")).toBeVisible()
    expect(
      screen.queryByRole("link", {
        name: "Open company #2: Juniper Dental Group",
      }),
    ).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, "6")
    expect(
      screen.getByRole("link", {
        name: "Open company #6: Summit Design Studio",
      }),
    ).toBeVisible()
    await user.clear(search)
    await user.type(search, "no customer here")
    expect(
      screen.getByRole("heading", { name: "No companies found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear company search" }),
    )
    expect(screen.getByText("Showing 6 of 6 companies")).toBeVisible()
  })

  it("navigates from a ticket to its company and back to the directory", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets/1048")
    const companyLink = screen.getByRole("link", {
      name: "Northstar Architecture",
    })
    expect(companyLink).toHaveAttribute("href", "/companies/1")
    const main = screen.getByRole("main")
    main.scrollTop = 200
    await user.click(companyLink)
    expect(
      screen.getByRole("heading", { name: "Northstar Architecture", level: 1 }),
    ).toBeVisible()
    expect(main.scrollTop).toBe(0)
    expect(
      screen.getByRole("heading", { name: "Company details" }),
    ).toBeVisible()
    expect(screen.getByRole("link", { name: "Companies" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Tickets" })).not.toHaveAttribute(
      "aria-current",
    )
    await user.click(screen.getByRole("link", { name: "Back to companies" }))
    expect(
      screen.getByRole("heading", { name: "Companies", level: 1 }),
    ).toBeVisible()
  })

  it("renders only actual Company fields plus deduplicated related sample records", () => {
    renderRoute("/companies/2")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", { name: "Company details" }),
    ).toBeVisible()
    expect(
      within(main).getByText("Company ID").nextElementSibling,
    ).toHaveTextContent("#2")
    expect(
      within(main).getByText("Company name").nextElementSibling,
    ).toHaveTextContent("Juniper Dental Group")
    const tickets = within(main).getByRole("table", { name: "Company tickets" })
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1047/ }),
    ).toBeVisible()
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1041/ }),
    ).toBeVisible()
    expect(
      within(tickets).queryByRole("link", { name: /Open ticket #1048/ }),
    ).not.toBeInTheDocument()
    expect(within(main).getAllByText("Priya Shah")).toHaveLength(3)
    expect(within(main).getByText("priya.shah@juniper.example")).toBeVisible()
    expect(within(main).getByText("Main practice")).toBeVisible()
    expect(within(main).getByText("Reception workstation")).toBeVisible()
    expect(within(main).queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("shows the empty-state company without inventing company fields", () => {
    renderRoute("/companies/6")
    expect(
      screen.getByRole("heading", { name: "Summit Design Studio", level: 1 }),
    ).toBeVisible()
    for (const label of ["tickets", "contacts", "sites", "assets"]) {
      expect(screen.getByText(`No ${label} in this demo sample.`)).toBeVisible()
    }
    expect(screen.queryByText("No tickets found")).not.toBeInTheDocument()
  })

  it.each(["9999", "not-a-number", "1.5", "01"])(
    "handles invalid company ID %s within the shell",
    (id) => {
      renderRoute(`/companies/${id}`)
      expect(
        screen.getByRole("heading", { name: "Company not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("link", { name: "Back to companies" }),
      ).toHaveAttribute("href", "/companies")
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
    },
  )

  it("opens company navigation and the disconnected assistant sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/companies/1")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("link", { name: "Companies" }),
    ).toHaveAttribute("aria-current", "page")
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Agent service disconnected")).toBeVisible()
  })

  it("closes the mobile navigation sheet when changing destinations", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets")
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    await user.click(await screen.findByRole("link", { name: "Companies" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Sidebar" }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("heading", { name: "Companies", level: 1 }),
    ).toBeVisible()

    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    await user.click(await screen.findByRole("link", { name: "Tickets" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Sidebar" }),
      ).not.toBeInTheDocument(),
    )
    expect(screen.getByRole("heading", { name: "Ticket queue" })).toBeVisible()
  })
})

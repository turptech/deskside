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

describe("contact routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("renders a searchable Contact directory and enables primary navigation", () => {
    renderRoute("/contacts")
    expect(
      screen.getByRole("heading", { name: "Contacts", level: 1 }),
    ).toBeVisible()
    expect(
      screen.getByRole("table", { name: "Contact directory" }),
    ).toBeVisible()
    expect(screen.getByText("Showing 8 of 8 contacts")).toBeVisible()
    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(
      screen.getByText("Contact directory", { selector: "p" }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Open contact #1: Morgan Lee" }),
    ).toHaveAttribute("href", "/contacts/1")
    expect(
      screen.getByRole("link", { name: "Open contact #8: Dana Ellis" }),
    ).toBeVisible()
    expect(
      screen.getByRole("complementary", { name: "DeskSide Assistant" }),
    ).toBeVisible()
  })

  it("searches by ID, name, email, company, and site", async () => {
    const user = userEvent.setup()
    renderRoute("/contacts")
    const search = screen.getByRole("textbox", { name: "Search contacts" })
    for (const query of [
      "8",
      "Dana Ellis",
      "dana.ellis@northstar.example",
      "Northstar",
      "Durham studio",
    ]) {
      await user.clear(search)
      await user.type(search, query)
      expect(
        screen.getByRole("link", { name: "Open contact #8: Dana Ellis" }),
      ).toBeVisible()
    }
    await user.clear(search)
    await user.type(search, "no matching person")
    expect(
      screen.getByRole("heading", { name: "No contacts found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear contact filters" }),
    )
    expect(screen.getByText("Showing 8 of 8 contacts")).toBeVisible()
  })

  it("combines search with the company filter and clears both", async () => {
    const user = userEvent.setup()
    renderRoute("/contacts")
    await user.click(
      screen.getByRole("combobox", { name: "Filter by company" }),
    )
    await user.click(
      screen.getByRole("option", { name: "Juniper Dental Group" }),
    )
    expect(screen.getByText("Showing 1 of 8 contacts")).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Open contact #2: Priya Shah" }),
    ).toBeVisible()
    const search = screen.getByRole("textbox", { name: "Search contacts" })
    await user.type(search, "Morgan")
    expect(
      screen.getByRole("heading", { name: "No contacts found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear contact filters" }),
    )
    expect(screen.getByText("Showing 8 of 8 contacts")).toBeVisible()
  })

  it("renders a direct Contact URL with supported fields and parent links", () => {
    renderRoute("/contacts/1")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", { name: "Morgan Lee", level: 1 }),
    ).toBeVisible()
    expect(
      within(main).getByText("Contact ID").nextElementSibling,
    ).toHaveTextContent("#1")
    expect(
      within(main).getByText("First name").nextElementSibling,
    ).toHaveTextContent("Morgan")
    expect(
      within(main).getByText("Last name").nextElementSibling,
    ).toHaveTextContent("Lee")
    expect(
      within(main).getByText("Email").nextElementSibling,
    ).toHaveTextContent("morgan.lee@northstar.example")
    expect(
      within(main).getByText("Phone").nextElementSibling,
    ).toHaveTextContent("(919) 555-0148")
    expect(
      within(main).getByText("Mobile phone").nextElementSibling,
    ).toHaveTextContent("(919) 555-0248")
    expect(
      within(main).getByText("Job title").nextElementSibling,
    ).toHaveTextContent("Design operations manager")
    expect(
      within(main).getByRole("link", { name: "Northstar Architecture" }),
    ).toHaveAttribute("href", "/companies/1")
    expect(
      within(main).getByRole("link", { name: "Raleigh office" }),
    ).toHaveAttribute("href", "/sites/1")
    const tickets = within(main).getByRole("table", { name: "Contact tickets" })
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1048/ }),
    ).toBeVisible()
    expect(
      within(tickets).queryByRole("link", { name: /Open ticket #1043/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Contact details", { selector: "p" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Contacts" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("shows Priya's two tickets even though one ticket belongs to another Site", () => {
    renderRoute("/contacts/2")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("link", { name: "Main practice" }),
    ).toHaveAttribute("href", "/sites/2")
    const tickets = within(main).getByRole("table", { name: "Contact tickets" })
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1047/ }),
    ).toBeVisible()
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1041/ }),
    ).toBeVisible()
  })

  it("shows absent fields, an unlinked Site, and the no-ticket state", () => {
    renderRoute("/contacts/4")
    const main = screen.getByRole("main")
    expect(within(main).getByText("Site").nextElementSibling).toHaveTextContent(
      "Not linked",
    )
    expect(
      within(main).getByText("Phone").nextElementSibling,
    ).toHaveTextContent("Not provided")
    expect(
      within(main).getByText("Mobile phone").nextElementSibling,
    ).toHaveTextContent("Not provided")
  })

  it("shows the no-ticket fixture on Durham studio", () => {
    renderRoute("/contacts/8")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("link", { name: "Durham studio" }),
    ).toHaveAttribute("href", "/sites/6")
    expect(
      within(main).getByText(
        "No tickets linked to this contact in this demo sample.",
      ),
    ).toBeVisible()
    expect(
      within(main).queryByRole("table", { name: "Contact tickets" }),
    ).not.toBeInTheDocument()
  })

  it("navigates from Company to Contact and back, resetting center scroll", async () => {
    const user = userEvent.setup()
    renderRoute("/companies/1")
    const main = screen.getByRole("main")
    const link = within(main).getByRole("link", {
      name: "Open contact #1: Morgan Lee",
    })
    expect(link).toHaveAttribute("href", "/contacts/1")
    main.scrollTop = 300
    await user.click(link)
    expect(
      within(main).getByRole("heading", { name: "Morgan Lee", level: 1 }),
    ).toBeVisible()
    expect(main.scrollTop).toBe(0)
    await user.click(
      within(main).getByRole("link", { name: "Back to contacts" }),
    )
    expect(
      screen.getByRole("heading", { name: "Contacts", level: 1 }),
    ).toBeVisible()
  })

  it("navigates from Site and Ticket Detail to their Contact", async () => {
    const user = userEvent.setup()
    const siteView = renderRoute("/sites/6")
    await user.click(
      within(screen.getByRole("main")).getByRole("link", {
        name: "Open contact #8: Dana Ellis",
      }),
    )
    expect(
      screen.getByRole("heading", { name: "Dana Ellis", level: 1 }),
    ).toBeVisible()
    siteView.unmount()

    renderRoute("/tickets/1048")
    const ticketLink = await within(screen.getByRole("main")).findByRole(
      "link",
      {
        name: "Morgan Lee",
      },
    )
    expect(ticketLink).toHaveAttribute("href", "/contacts/1")
    await user.click(ticketLink)
    expect(
      screen.getByRole("heading", { name: "Morgan Lee", level: 1 }),
    ).toBeVisible()
  })

  it.each(["9999", "not-a-number", "1.5", "01", "0"])(
    "handles invalid Contact ID %s inside the shell",
    (id) => {
      renderRoute(`/contacts/${id}`)
      expect(
        screen.getByRole("heading", { name: "Contact not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("link", { name: "Back to contacts" }),
      ).toHaveAttribute("href", "/contacts")
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
    },
  )

  it("opens Contact navigation and the disconnected assistant sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/contacts/1")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("link", { name: "Contacts" }),
    ).toHaveAttribute("data-active", "true")
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Agent service disconnected")).toBeVisible()
  })

  it("opens the Contact directory from mobile navigation and closes the sheet", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets")
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    await user.click(await screen.findByRole("link", { name: "Contacts" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Sidebar" }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("heading", { name: "Contacts", level: 1 }),
    ).toBeVisible()
  })
})

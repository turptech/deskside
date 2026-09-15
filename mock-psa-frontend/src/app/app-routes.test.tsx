import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"

import { AppRoutes } from "@/app/app-routes"
import { ThemeProvider } from "@/app/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"

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

describe("application routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("redirects the root route to the ticket queue", async () => {
    renderRoute("/")

    expect(
      await screen.findByRole("heading", { name: "Ticket queue" }),
    ).toBeInTheDocument()
  })

  it("renders the core workspace regions and synthetic queue", () => {
    renderRoute("/tickets")

    expect(screen.getByText("DeskSide")).toBeInTheDocument()
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument()
    expect(screen.getByRole("table", { name: "Ticket queue" })).toBeVisible()
    expect(screen.getByText("#1048")).toBeInTheDocument()
    expect(screen.getByText("Active tickets")).toBeInTheDocument()
    expect(
      screen.getByRole("complementary", { name: "DeskSide Assistant" }),
    ).toBeInTheDocument()
    expect(screen.getByText("Ready for a ticket")).toBeInTheDocument()
  })

  it("filters tickets by ID, summary, company, or contact", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets")
    const search = screen.getByRole("textbox", { name: "Search tickets" })

    await user.type(search, "Northstar")
    expect(screen.getByText("#1048")).toBeInTheDocument()
    expect(screen.getByText("#1043")).toBeInTheDocument()
    expect(screen.queryByText("#1047")).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, "1047")
    expect(screen.getByText("#1047")).toBeInTheDocument()
    expect(screen.queryByText("#1048")).not.toBeInTheDocument()
  })

  it("combines status and search filters and supports clearing them", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets")

    await user.type(
      screen.getByRole("textbox", { name: "Search tickets" }),
      "Priya",
    )
    await user.click(screen.getByRole("combobox", { name: "Filter by status" }))
    await user.click(screen.getByRole("option", { name: "Resolved" }))

    expect(screen.getByText("#1041")).toBeInTheDocument()
    expect(screen.queryByText("#1047")).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: "Clear ticket filters" }),
    )
    expect(screen.getByText("Showing 8 of 8 tickets")).toBeInTheDocument()
  })

  it("shows a polished no-results state", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets")

    await user.type(
      screen.getByRole("textbox", { name: "Search tickets" }),
      "not a real customer",
    )

    expect(
      screen.getByRole("heading", { name: "No tickets found" }),
    ).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("opens navigation and assistant sheets on a mobile viewport", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets")

    await waitFor(() => {
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("navigation", { name: "Primary navigation" }),
    ).toBeInTheDocument()

    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByRole("complementary", {
        name: "DeskSide Assistant",
      }),
    ).toBeInTheDocument()
  })

  it("renders a not-found state for unknown routes", () => {
    renderRoute("/does-not-exist")

    expect(
      screen.getByRole("heading", { name: "Workspace not found" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: "Return to tickets" }),
    ).toHaveAttribute("href", "/tickets")
  })
})

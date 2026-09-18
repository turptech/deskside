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

  it("opens a ticket from the queue and returns with primary navigation active", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets")
    const main = screen.getByRole("main")
    main.scrollTop = 200
    await user.click(
      screen.getByRole("link", {
        name: "Open ticket #1048: VPN disconnecting across Raleigh office",
      }),
    )

    expect(
      screen.getByRole("heading", {
        name: "VPN disconnecting across Raleigh office",
      }),
    ).toBeVisible()
    expect(main.scrollTop).toBe(0)
    expect(screen.getByRole("link", { name: "Tickets" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByText("No agent session connected")).toBeInTheDocument()

    await user.click(screen.getByRole("link", { name: "Back to tickets" }))
    expect(screen.getByRole("heading", { name: "Ticket queue" })).toBeVisible()
  })

  it("renders a direct detail URL with ticket, customer, description, and activity information", () => {
    renderRoute("/tickets/1048")
    const main = screen.getByRole("main")
    for (const name of [
      "Ticket details",
      "Customer context",
      "Description",
      "Activity",
    ]) {
      expect(within(main).getByRole("heading", { name })).toBeVisible()
    }
    expect(within(main).getByText("morgan.lee@northstar.example")).toBeVisible()
    expect(within(main).getByText("(919) 555-0148")).toBeVisible()
    expect(within(main).getByText("Raleigh office")).toBeVisible()
    expect(within(main).getByText("NS-RAL-FW-01")).toBeVisible()
    expect(
      within(main).getByText(/Several team members at the Raleigh office/),
    ).toHaveTextContent("Morgan can coordinate testing")
    expect(within(main).getByText("Phone", { selector: "dd" })).toBeVisible()
    expect(within(main).getByText("Created")).toBeVisible()
    expect(within(main).getByText("Updated")).toBeVisible()
    expect(within(main).getByText("Internal note")).toBeVisible()
    expect(within(main).getAllByText("Public note")).toHaveLength(2)
    expect(
      within(main).getByText("Morgan Lee", { selector: "p" }),
    ).toBeVisible()
    expect(within(main).getByText("Billable", { exact: true })).toBeVisible()
    expect(within(main).getByText("Non-billable")).toBeVisible()
    expect(within(main).getByText("Associated note #502")).toBeVisible()
    expect(
      within(main).getByText("Logged time").nextElementSibling,
    ).toHaveTextContent("45 min")
    expect(
      within(main).getByText("Billable time").nextElementSibling,
    ).toHaveTextContent("30 min")
    expect(within(main).queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("orders activity newest first and filters notes and time entries without changing totals", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets/1048")
    const activity = screen.getByRole("list", { name: "Ticket activity" })
    const items = within(activity).getAllByRole("listitem")
    expect(items).toHaveLength(5)
    expect(items[0]).toHaveTextContent("Note #503")
    expect(items[1]).toHaveTextContent("Entry #702")
    expect(items[2]).toHaveTextContent("Note #502")
    expect(items[3]).toHaveTextContent("Entry #701")
    expect(items[4]).toHaveTextContent("Note #501")

    await user.click(screen.getByRole("tab", { name: /^Notes/ }))
    expect(screen.getByRole("tab", { name: /^Notes/ })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(
      within(
        screen.getByRole("list", { name: "Ticket activity" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(3)
    expect(screen.queryByText("Non-billable")).not.toBeInTheDocument()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: /^Time entries/ })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(
      within(
        screen.getByRole("list", { name: "Ticket activity" }),
      ).getAllByRole("listitem"),
    ).toHaveLength(2)
    expect(screen.queryByText("Internal note")).not.toBeInTheDocument()
    expect(
      screen.getByText("Logged time").nextElementSibling,
    ).toHaveTextContent("45 min")
    expect(
      screen.getByText("Billable time").nextElementSibling,
    ).toHaveTextContent("30 min")
  })

  it("renders missing relationships, description, and empty activity without edit controls", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets/1045")
    expect(screen.getByText("Unassigned")).toBeVisible()
    expect(screen.getByText("Not provided")).toBeVisible()
    expect(screen.getAllByText("Not linked")).toHaveLength(2)
    expect(screen.getByText("No description provided.")).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "No activity to show" }),
    ).toBeVisible()
    await user.click(screen.getByRole("tab", { name: /^Time entries/ }))
    expect(
      screen.getByRole("heading", { name: "No activity to show" }),
    ).toBeVisible()
    expect(
      screen.getByText("Logged time").nextElementSibling,
    ).toHaveTextContent("0 min")
    expect(
      screen.queryByText("Resolved", { selector: "dt" }),
    ).not.toBeInTheDocument()
  })

  it("shows an empty filtered feed even when other activity exists", async () => {
    const user = userEvent.setup()
    renderRoute("/tickets/1047")
    expect(screen.getByRole("list", { name: "Ticket activity" })).toBeVisible()
    await user.click(screen.getByRole("tab", { name: /^Time entries/ }))
    expect(
      screen.getByRole("heading", { name: "No activity to show" }),
    ).toBeVisible()
  })

  it("shows the resolution timestamp on resolved tickets", () => {
    renderRoute("/tickets/1044")
    expect(
      screen.getByText("Resolved", { selector: "dt" }).nextElementSibling,
    ).toHaveTextContent("Sep 15, 2026, 1:30 PM UTC")
    expect(
      screen.getByText("Logged time").nextElementSibling,
    ).toHaveTextContent("1 hr")
  })

  it.each(["9999", "not-a-number", "1048.5", "01048"])(
    "handles missing or invalid ticket ID %s inside the shell",
    (id) => {
      renderRoute(`/tickets/${id}`)
      expect(
        screen.getByRole("heading", { name: "Ticket not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: "Back to tickets" }),
      ).toHaveAttribute("href", "/tickets")
    },
  )

  it("opens the navigation and contextual assistant sheets on a mobile detail route", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets/1048")
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(
      await screen.findByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible()
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("No agent session connected")).toBeVisible()
    expect(within(dialog).getByText("Agent service disconnected")).toBeVisible()
  })
})

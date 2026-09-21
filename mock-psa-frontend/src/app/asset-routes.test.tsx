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

describe("asset routes", () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    })
  })

  it("renders the Asset directory in the shell and enables navigation", () => {
    renderRoute("/assets")
    expect(
      screen.getByRole("heading", { name: "Assets", level: 1 }),
    ).toBeVisible()
    expect(screen.getByRole("table", { name: "Asset directory" })).toBeVisible()
    expect(screen.getByText("Showing 8 of 8 assets")).toBeVisible()
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute(
      "aria-current",
      "page",
    )
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute(
      "data-active",
      "true",
    )
    expect(screen.getByText("Asset directory", { selector: "p" })).toBeVisible()
    expect(
      screen.getByRole("link", { name: "Open asset #1: Office VPN gateway" }),
    ).toHaveAttribute("href", "/assets/1")
    expect(
      screen.getByRole("link", {
        name: "Open asset #8: Studio rendering workstation",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("complementary", { name: "DeskSide Assistant" }),
    ).toBeVisible()
  })

  it("searches ID, name, tag, serial, hostname, manufacturer, model, and relationships", async () => {
    const user = userEvent.setup()
    renderRoute("/assets")
    const search = screen.getByRole("textbox", { name: "Search assets" })
    for (const query of [
      "8",
      "Studio rendering workstation",
      "NS-WS-008",
      "DEMO-NS-0008",
      "NS-DUR-RENDER-01",
      "Aster Computing",
      "Render Workstation 900",
      "Northstar Architecture",
      "Durham studio",
    ]) {
      await user.clear(search)
      await user.type(search, query)
      expect(
        screen.getByRole("link", {
          name: "Open asset #8: Studio rendering workstation",
        }),
      ).toBeVisible()
    }
    await user.clear(search)
    await user.type(search, "Robin Carter")
    expect(
      screen.getByRole("link", {
        name: "Open asset #5: Replacement mobile phone",
      }),
    ).toBeVisible()
    await user.clear(search)
    await user.type(search, "nothing matching")
    expect(
      screen.getByRole("heading", { name: "No assets found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear asset filters" }),
    )
    expect(screen.getByText("Showing 8 of 8 assets")).toBeVisible()
  })

  it("combines Company, type, status, and search filters", async () => {
    const user = userEvent.setup()
    renderRoute("/assets")
    await user.click(
      screen.getByRole("combobox", { name: "Filter assets by company" }),
    )
    await user.click(
      screen.getByRole("option", { name: "Northstar Architecture" }),
    )
    expect(screen.getByText("Showing 3 of 8 assets")).toBeVisible()
    await user.click(
      screen.getByRole("combobox", { name: "Filter assets by type" }),
    )
    await user.click(screen.getByRole("option", { name: "Desktop" }))
    expect(screen.getByText("Showing 1 of 8 assets")).toBeVisible()
    await user.click(
      screen.getByRole("combobox", { name: "Filter assets by status" }),
    )
    await user.click(screen.getByRole("option", { name: "Active" }))
    await user.type(
      screen.getByRole("textbox", { name: "Search assets" }),
      "Durham",
    )
    expect(
      screen.getByRole("link", {
        name: "Open asset #8: Studio rendering workstation",
      }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("combobox", { name: "Filter assets by status" }),
    )
    await user.click(screen.getByRole("option", { name: "Maintenance" }))
    expect(
      screen.getByRole("heading", { name: "No assets found" }),
    ).toBeVisible()
    await user.click(
      screen.getByRole("button", { name: "Clear asset filters" }),
    )
    expect(screen.getByText("Showing 8 of 8 assets")).toBeVisible()
  })

  it("renders the API-supported Asset fields, assignment links, and related tickets", () => {
    renderRoute("/assets/1")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("heading", {
        name: "Office VPN gateway",
        level: 1,
      }),
    ).toBeVisible()
    for (const [label, value] of [
      ["Asset ID", "#1"],
      ["Asset name", "Office VPN gateway"],
      ["Type", "Network device"],
      ["Status", "Active"],
      ["Manufacturer", "NetCore"],
      ["Model", "Secure Gateway 60"],
      ["Operating system", "NetCore OS"],
      ["Asset tag", "NS-IT-001"],
      ["Serial number", "DEMO-NS-0001"],
      ["Hostname", "NS-RAL-FW-01"],
    ] as [string, string][]) {
      expect(
        within(main).getByText(label, { selector: "dt" }).nextElementSibling,
      ).toHaveTextContent(value)
    }
    expect(
      within(main).getByRole("link", { name: "Northstar Architecture" }),
    ).toHaveAttribute("href", "/companies/1")
    expect(
      within(main).getByRole("link", { name: "Raleigh office" }),
    ).toHaveAttribute("href", "/sites/1")
    expect(
      within(main).getByText("Assigned contact").nextElementSibling,
    ).toHaveTextContent("Not linked")
    const tickets = within(main).getByRole("table", { name: "Asset tickets" })
    expect(
      within(tickets).getByRole("link", { name: /Open ticket #1048/ }),
    ).toBeVisible()
    expect(
      within(tickets).queryByRole("link", { name: /Open ticket #1043/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByText("Asset details", { selector: "p" })).toBeVisible()
    expect(screen.getByRole("link", { name: "Assets" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })

  it("shows contact assignment without inferring a Site, and missing optional fields", () => {
    const view = renderRoute("/assets/5")
    const main = screen.getByRole("main")
    expect(
      within(main).getByRole("link", { name: "Robin Carter" }),
    ).toHaveAttribute("href", "/contacts/7")
    expect(
      within(main).getByText("Assigned site").nextElementSibling,
    ).toHaveTextContent("Not linked")
    expect(
      within(main).getByText("Hostname").nextElementSibling,
    ).toHaveTextContent("Not provided")
    view.unmount()

    renderRoute("/assets/7")
    expect(
      screen.getByText("Assigned site").nextElementSibling,
    ).toHaveTextContent("Not linked")
    expect(
      screen.getByText("Assigned contact").nextElementSibling,
    ).toHaveTextContent("Not linked")
    expect(
      screen.getByText("Operating system").nextElementSibling,
    ).toHaveTextContent("Not provided")
    expect(
      screen.getByText("No tickets linked to this asset in this demo sample."),
    ).toBeVisible()
  })

  it("navigates directory to Asset Detail and back", async () => {
    const user = userEvent.setup()
    renderRoute("/assets")
    await user.click(
      screen.getByRole("link", {
        name: "Open asset #8: Studio rendering workstation",
      }),
    )
    expect(
      screen.getByRole("heading", {
        name: "Studio rendering workstation",
        level: 1,
      }),
    ).toBeVisible()
    expect(
      screen.getByText("No tickets linked to this asset in this demo sample."),
    ).toBeVisible()
    await user.click(screen.getByRole("link", { name: "Back to assets" }))
    expect(
      screen.getByRole("heading", { name: "Assets", level: 1 }),
    ).toBeVisible()
  })

  it("links from Company, Site, Contact, and Ticket Detail to the correct Asset", async () => {
    const user = userEvent.setup()
    for (const [path, linkName, assetName] of [
      ["/companies/1", "Open asset #7: Spare laptop", "Spare laptop"],
      ["/sites/5", "Open asset #6: Branch resolver", "Branch resolver"],
      [
        "/contacts/7",
        "Open asset #5: Replacement mobile phone",
        "Replacement mobile phone",
      ],
      ["/tickets/1048", "Office VPN gateway", "Office VPN gateway"],
    ] as [string, string, string][]) {
      const view = renderRoute(path)
      const link = within(screen.getByRole("main")).getByRole("link", {
        name: linkName,
      })
      await user.click(link)
      expect(
        screen.getByRole("heading", { name: assetName, level: 1 }),
      ).toBeVisible()
      view.unmount()
    }
  })

  it("shows only explicit Site and Contact assignments, including a Site Asset with no tickets", () => {
    const siteView = renderRoute("/sites/6")
    const siteMain = screen.getByRole("main")
    expect(
      within(siteMain).getByRole("link", {
        name: "Open asset #8: Studio rendering workstation",
      }),
    ).toHaveAttribute("href", "/assets/8")
    expect(
      within(siteMain).getByText(
        "No tickets assigned to this site in this demo sample.",
      ),
    ).toBeVisible()
    siteView.unmount()

    renderRoute("/contacts/2")
    const contactMain = screen.getByRole("main")
    expect(
      within(contactMain).getByText(
        "No assets assigned to this contact in this demo sample.",
      ),
    ).toBeVisible()
    expect(
      within(contactMain).queryByRole("link", { name: /Branch resolver/ }),
    ).not.toBeInTheDocument()
  })

  it.each(["9999", "not-a-number", "1.5", "01", "0"])(
    "handles invalid Asset ID %s inside the shell",
    (id) => {
      renderRoute(`/assets/${id}`)
      expect(
        screen.getByRole("heading", { name: "Asset not found" }),
      ).toBeVisible()
      expect(
        screen.getByRole("link", { name: "Back to assets" }),
      ).toHaveAttribute("href", "/assets")
      expect(
        screen.getByRole("navigation", { name: "Primary navigation" }),
      ).toBeInTheDocument()
    },
  )

  it("opens Asset navigation and the disconnected assistant sheet on mobile", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/assets/1")
    await waitFor(() =>
      expect(
        screen.queryByRole("navigation", { name: "Primary navigation" }),
      ).not.toBeInTheDocument(),
    )
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    expect(await screen.findByRole("link", { name: "Assets" })).toHaveAttribute(
      "data-active",
      "true",
    )
    await user.keyboard("{Escape}")
    await user.click(
      screen.getByRole("button", { name: "Open DeskSide Assistant" }),
    )
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Agent service disconnected")).toBeVisible()
  })

  it("opens the Asset directory from mobile navigation and closes the sheet", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 390,
    })
    const user = userEvent.setup()
    renderRoute("/tickets")
    await user.click(screen.getByRole("button", { name: "Open navigation" }))
    await user.click(await screen.findByRole("link", { name: "Assets" }))
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Sidebar" }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole("heading", { name: "Assets", level: 1 }),
    ).toBeVisible()
  })
})

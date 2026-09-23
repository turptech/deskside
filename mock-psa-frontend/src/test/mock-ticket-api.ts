import { demoData } from "@/demo-data"

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

/** Test-only transport that exposes the shared demo records as API responses. */
export async function mockTicketApiFetch(input: RequestInfo | URL) {
  const url = new URL(
    input instanceof Request ? input.url : String(input),
    "http://localhost",
  )
  const path = url.pathname.replace(/^\/api/, "")
  const parts = path.split("/").filter(Boolean)
  const id = Number(parts[1])
  const offset = Number(url.searchParams.get("offset") ?? 0)
  const limit = Number(url.searchParams.get("limit") ?? 100)

  if (path === "/tickets")
    return json(demoData.tickets.slice(offset, offset + limit))
  if (parts[0] === "tickets" && Number.isInteger(id)) {
    if (parts.length === 2) {
      const ticket = demoData.tickets.find((record) => record.id === id)
      return ticket ? json(ticket) : json({ detail: "Ticket not found" }, 404)
    }
    if (parts[2] === "notes")
      return json(
        demoData.ticket_notes
          .filter((note) => note.ticket_id === id)
          .slice(offset, offset + limit),
      )
    if (parts[2] === "time-entries")
      return json(
        demoData.time_entries
          .filter((entry) => entry.ticket_id === id)
          .slice(offset, offset + limit),
      )
  }
  const collections = {
    companies: demoData.companies,
    contacts: demoData.contacts,
    sites: demoData.sites,
    assets: demoData.assets,
  }
  const records = collections[parts[0] as keyof typeof collections]
  if (records && parts.length === 2) {
    const record = records.find((item) => item.id === id)
    return record ? json(record) : json({ detail: "Not found" }, 404)
  }
  return json({ detail: "Not found" }, 404)
}

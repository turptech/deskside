import { QueryClient } from "@tanstack/react-query"
import createFetchClient from "openapi-fetch"

import type { paths } from "@/api/generated-schema"
import { demoData } from "@/demo-data"
import {
  fetchTicket,
  fetchTicketPage,
  fetchTicketWorkspace,
  nextTicketOffset,
  relativeTicketTime,
  TicketRequestError,
  type TicketWire,
} from "@/features/tickets/ticket-api"
import { mockTicketApiFetch } from "@/test/mock-ticket-api"

const demoTicket = demoData.tickets.find(({ id }) => id === 1048)! as TicketWire

function makeApi(
  fetcher: (request: Request) => Promise<Response> = mockTicketApiFetch,
) {
  return createFetchClient<paths>({
    baseUrl: "http://localhost/api",
    fetch: fetcher,
  })
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

describe("ticket API adapters", () => {
  it("maps API relationships without borrowing technician names from fixtures", async () => {
    const page = await fetchTicketPage(makeApi(), new QueryClient(), 0)
    const ticket = page.summaries.find(({ id }) => id === 1048)
    expect(ticket).toMatchObject({
      id: 1048,
      company: "Northstar Architecture",
      contact: "Morgan Lee",
      assignee: "Technician #1001",
    })
    expect(ticket?.updatedAt).not.toBe("Yesterday")
    expect(
      relativeTicketTime(
        "2026-09-23T12:00:00Z",
        Date.parse("2026-09-23T12:05:00Z"),
      ),
    ).toBe("5 min ago")
  })

  it("loads pages in blocks of 100 and signals when another page is possible", async () => {
    const records = Array.from({ length: 101 }, (_, index) => ({
      ...demoTicket,
      id: 2000 + index,
    }))
    const requests: number[] = []
    const api = makeApi(async (request) => {
      const url = new URL(request.url)
      if (url.pathname === "/api/tickets") {
        const offset = Number(url.searchParams.get("offset"))
        requests.push(offset)
        return json(records.slice(offset, offset + 100))
      }
      return mockTicketApiFetch(request)
    })
    const cache = new QueryClient()
    const first = await fetchTicketPage(api, cache, 0)
    expect(first.summaries).toHaveLength(100)
    expect(nextTicketOffset(first, [first])).toBe(100)
    const second = await fetchTicketPage(api, cache, 100)
    expect(second.summaries).toHaveLength(1)
    expect(nextTicketOffset(second, [first, second])).toBeUndefined()
    expect(requests).toEqual([0, 100])
  })

  it("uses honest ID labels when a live related record cannot be resolved", async () => {
    const api = makeApi(async (request) => {
      if (new URL(request.url).pathname === "/api/tickets")
        return json([{ ...demoTicket, company_id: 999, contact_id: 999 }])
      return mockTicketApiFetch(request)
    })
    const page = await fetchTicketPage(api, new QueryClient(), 0)
    expect(page.summaries[0]).toMatchObject({
      company: "Company #999",
      contact: "Contact #999",
    })
  })

  it("loads every activity page so totals can cover the full ticket", async () => {
    const note = demoData.ticket_notes.find(
      ({ ticket_id }) => ticket_id === 1048,
    )!
    const notes = Array.from({ length: 101 }, (_, index) => ({
      ...note,
      id: 5000 + index,
    }))
    const api = makeApi(async (request) => {
      const url = new URL(request.url)
      if (url.pathname === "/api/tickets/1048/notes") {
        const offset = Number(url.searchParams.get("offset"))
        return json(notes.slice(offset, offset + 100))
      }
      return mockTicketApiFetch(request)
    })
    const detail = await fetchTicketWorkspace(
      api,
      new QueryClient(),
      demoTicket,
    )
    expect(detail.notes).toHaveLength(101)
    expect(detail.timeEntries).toHaveLength(2)
    expect(detail.notes[0]?.author.name).toMatch(/Technician #|Morgan Lee/)
  })

  it("distinguishes an API 404 from an unavailable request", async () => {
    await expect(fetchTicket(makeApi(), 9999)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<TicketRequestError>)
  })
})

import type { QueryClient } from "@tanstack/react-query"
import type { Client } from "openapi-fetch"
import createQueryClient from "openapi-react-query"

import type { components, paths } from "@/api/generated-schema"
import type { TicketDetail, TicketSummary } from "@/features/tickets/types"

export type TicketWire = components["schemas"]["TicketRead"]
type NoteWire = components["schemas"]["TicketNoteRead"]
type TimeWire = components["schemas"]["TimeEntryRead"]
type CompanyWire = components["schemas"]["CompanyRead"]
type ContactWire = components["schemas"]["ContactRead"]
type SiteWire = components["schemas"]["SiteRead"]
type AssetWire = components["schemas"]["AssetRead"]
export type TicketClient = Client<paths>

const PAGE_SIZE = 100

export class TicketRequestError extends Error {
  status: number

  constructor(status: number, message = "Unable to load ticket data") {
    super(message)
    this.status = status
  }
}

function requiredData<T>(data: T | undefined, status: number): T {
  if (data === undefined) throw new TicketRequestError(status)
  return data
}

function contactName(contact: ContactWire) {
  return `${contact.first_name} ${contact.last_name}`
}

function technicianLabel(id: number | null | undefined) {
  return id == null ? null : `Technician #${id}`
}

export function relativeTicketTime(value: string, now = Date.now()) {
  const delta = now - Date.parse(value)
  if (!Number.isFinite(delta)) return "Unknown"
  if (delta < 60_000) return "Just now"
  const minutes = Math.floor(delta / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? "day" : "days"} ago`
}

type Relations = {
  company: CompanyWire | null
  contact: ContactWire | null
  site: SiteWire | null
  asset: AssetWire | null
}

async function ticketRelations(
  api: TicketClient,
  cache: QueryClient,
  ticket: TicketWire,
): Promise<Relations> {
  const queries = createQueryClient(api)
  const company = cache
    .fetchQuery(
      queries.queryOptions("get", "/companies/{company_id}", {
        params: { path: { company_id: ticket.company_id } },
      }),
    )
    .catch(() => null)
  const contact = cache
    .fetchQuery(
      queries.queryOptions("get", "/contacts/{contact_id}", {
        params: { path: { contact_id: ticket.contact_id } },
      }),
    )
    .catch(() => null)
  const site =
    ticket.site_id == null
      ? Promise.resolve(null)
      : cache
          .fetchQuery(
            queries.queryOptions("get", "/sites/{site_id}", {
              params: { path: { site_id: ticket.site_id } },
            }),
          )
          .catch(() => null)
  const asset =
    ticket.asset_id == null
      ? Promise.resolve(null)
      : cache
          .fetchQuery(
            queries.queryOptions("get", "/assets/{asset_id}", {
              params: { path: { asset_id: ticket.asset_id } },
            }),
          )
          .catch(() => null)
  const [resolvedCompany, resolvedContact, resolvedSite, resolvedAsset] =
    await Promise.all([company, contact, site, asset])
  return {
    company: resolvedCompany,
    contact: resolvedContact,
    site: resolvedSite,
    asset: resolvedAsset,
  }
}

export function toTicketSummary(
  ticket: TicketWire,
  relations: Pick<Relations, "company" | "contact">,
): TicketSummary {
  return {
    id: ticket.id,
    summary: ticket.summary,
    companyId: ticket.company_id,
    company: relations.company?.name ?? `Company #${ticket.company_id}`,
    contactId: ticket.contact_id,
    contact: relations.contact
      ? contactName(relations.contact)
      : `Contact #${ticket.contact_id}`,
    priority: ticket.priority,
    status: ticket.status,
    assignee: technicianLabel(ticket.assigned_user_id),
    source: ticket.source,
    updatedAt: relativeTicketTime(ticket.updated_at),
  }
}

export type TicketPage = {
  records: TicketWire[]
  summaries: TicketSummary[]
}

export async function fetchTicketPage(
  api: TicketClient,
  cache: QueryClient,
  offset: number,
  signal?: AbortSignal,
): Promise<TicketPage> {
  const result = await api.GET("/tickets", {
    params: { query: { offset, limit: PAGE_SIZE } },
    signal,
  })
  const records = requiredData(result.data, result.response.status)
  const summaries = await Promise.all(
    records.map(async (ticket) =>
      toTicketSummary(ticket, await ticketRelations(api, cache, ticket)),
    ),
  )
  return { records, summaries }
}

export function nextTicketOffset(page: TicketPage, pages: TicketPage[]) {
  return page.records.length === PAGE_SIZE
    ? pages.length * PAGE_SIZE
    : undefined
}

export async function fetchTicket(
  api: TicketClient,
  ticketId: number,
  signal?: AbortSignal,
) {
  const result = await api.GET("/tickets/{ticket_id}", {
    params: { path: { ticket_id: ticketId } },
    signal,
  })
  return requiredData(result.data, result.response.status)
}

async function fetchAllNotes(api: TicketClient, ticketId: number) {
  const notes: NoteWire[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await api.GET("/tickets/{ticket_id}/notes", {
      params: {
        path: { ticket_id: ticketId },
        query: { offset, limit: PAGE_SIZE },
      },
    })
    const page = requiredData(result.data, result.response.status)
    notes.push(...page)
    if (page.length < PAGE_SIZE) return notes
  }
}

async function fetchAllTimeEntries(api: TicketClient, ticketId: number) {
  const entries: TimeWire[] = []
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const result = await api.GET("/tickets/{ticket_id}/time-entries", {
      params: {
        path: { ticket_id: ticketId },
        query: { offset, limit: PAGE_SIZE },
      },
    })
    const page = requiredData(result.data, result.response.status)
    entries.push(...page)
    if (page.length < PAGE_SIZE) return entries
  }
}

function siteAddress(site: SiteWire): string | null {
  const parts = [
    site.address_line1,
    site.address_line2,
    site.city,
    site.state_province,
    site.postal_code,
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : null
}

export async function fetchTicketWorkspace(
  api: TicketClient,
  cache: QueryClient,
  ticket: TicketWire,
): Promise<TicketDetail> {
  const [relations, notes, timeEntries] = await Promise.all([
    ticketRelations(api, cache, ticket),
    fetchAllNotes(api, ticket.id),
    fetchAllTimeEntries(api, ticket.id),
  ])
  const queries = createQueryClient(api)
  const noteContacts = new Map<number, ContactWire | null>()
  await Promise.all(
    [
      ...new Set(
        notes.map((note) => note.contact_id).filter((id) => id != null),
      ),
    ].map(async (id) => {
      const contact = await cache
        .fetchQuery(
          queries.queryOptions("get", "/contacts/{contact_id}", {
            params: { path: { contact_id: id } },
          }),
        )
        .catch(() => null)
      noteContacts.set(id, contact)
    }),
  )
  return {
    ticket: toTicketSummary(ticket, relations),
    description: ticket.description ?? null,
    contact: {
      email: relations.contact?.email ?? "Not provided",
      phone: relations.contact?.phone ?? null,
    },
    site:
      ticket.site_id == null
        ? null
        : {
            id: ticket.site_id,
            name: relations.site?.name ?? `Site #${ticket.site_id}`,
            address: relations.site ? siteAddress(relations.site) : null,
          },
    asset:
      ticket.asset_id == null
        ? null
        : {
            id: ticket.asset_id,
            name: relations.asset?.name ?? `Asset #${ticket.asset_id}`,
            hostname: relations.asset?.hostname ?? null,
          },
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    resolvedAt: ticket.resolved_at,
    notes: notes.map((note) => ({
      id: note.id,
      type: note.type,
      author:
        note.user_id != null
          ? { name: `Technician #${note.user_id}`, kind: "technician" as const }
          : {
              name:
                note.contact_id == null
                  ? "Unknown contact"
                  : noteContacts.get(note.contact_id)
                    ? contactName(noteContacts.get(note.contact_id)!)
                    : `Contact #${note.contact_id}`,
              kind: "contact" as const,
            },
      body: note.body,
      createdAt: note.created_at,
    })),
    timeEntries: timeEntries.map((entry) => ({
      id: entry.id,
      technician: `Technician #${entry.user_id}`,
      ticketNoteId: entry.ticket_note_id ?? null,
      startedAt: entry.started_at,
      durationMinutes: entry.duration_minutes,
      description: entry.description,
      billable: entry.billable,
    })),
  }
}

export type TicketStatus =
  "new" | "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"

export type TicketPriority = "low" | "normal" | "high" | "urgent"

export type TicketSource = "phone" | "email" | "portal" | "monitoring" | "other"

/**
 * Frontend-only queue projection for synthetic demo records.
 *
 * Related display labels are intentionally resolved here. This is not the
 * FastAPI wire type and should be replaced by an API adapter when integration
 * begins.
 */
export type TicketSummary = {
  id: number
  summary: string
  companyId: number
  company: string
  contactId: number
  contact: string
  priority: TicketPriority
  status: TicketStatus
  assignee: string | null
  source: TicketSource
  updatedAt: string
}

/** Frontend-only, resolved display models. These are not API wire types. */
export type TicketNote = {
  id: number
  type: "public" | "internal"
  author: { name: string; kind: "technician" | "contact" }
  body: string
  createdAt: string
}

export type TicketTimeEntry = {
  id: number
  technician: string
  ticketNoteId: number | null
  startedAt: string
  durationMinutes: number
  description: string
  billable: boolean
}

export type TicketDetail = {
  ticket: TicketSummary
  description: string | null
  contact: { email: string; phone: string | null }
  site: { id: number; name: string; address: string | null } | null
  asset: { name: string; hostname: string | null } | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  notes: TicketNote[]
  timeEntries: TicketTimeEntry[]
}

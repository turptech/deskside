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
  company: string
  contact: string
  priority: TicketPriority
  status: TicketStatus
  assignee: string | null
  source: TicketSource
  updatedAt: string
}

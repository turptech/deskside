import { demoData, queueAge, technicianName } from "@/demo-data"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import type { TicketSummary } from "@/features/tickets/types"

export const ticketFixtures: TicketSummary[] = demoData.tickets.map(
  (ticket) => {
    const company = demoData.companies.find(
      ({ id }) => id === ticket.company_id,
    )
    const contact = contactFixtures.find(({ id }) => id === ticket.contact_id)
    if (!company || !contact || contact.companyId !== company.id)
      throw new Error(`Invalid demo company or contact for ticket ${ticket.id}`)
    return {
      id: ticket.id,
      summary: ticket.summary,
      companyId: company.id,
      company: company.name,
      contactId: contact.id,
      contact: getContactName(contact),
      priority: ticket.priority as TicketSummary["priority"],
      status: ticket.status as TicketSummary["status"],
      assignee: technicianName(ticket.assigned_user_id),
      source: ticket.source as TicketSummary["source"],
      updatedAt: queueAge(ticket.updated_at),
    }
  },
)

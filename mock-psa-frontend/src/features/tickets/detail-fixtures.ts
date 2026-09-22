import { demoData, technicianName } from "@/demo-data"
import { assetFixtures } from "@/features/assets/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { formatSiteAddress } from "@/features/sites/site-format"
import { ticketFixtures } from "@/features/tickets/fixtures"
import type { TicketDetail } from "@/features/tickets/types"

export const ticketDetailFixtures: TicketDetail[] = ticketFixtures.map(
  (ticket) => {
    const record = demoData.tickets.find(({ id }) => id === ticket.id)
    if (!record) throw new Error(`Missing demo detail for ticket ${ticket.id}`)
    const contact = contactFixtures.find(({ id }) => id === ticket.contactId)
    if (!contact || contact.companyId !== ticket.companyId)
      throw new Error(`Invalid demo contact for ticket ${ticket.id}`)
    const site =
      record.site_id === null
        ? null
        : siteFixtures.find(({ id }) => id === record.site_id)
    if (
      record.site_id !== null &&
      (!site || site.companyId !== ticket.companyId)
    )
      throw new Error(`Invalid demo site for ticket ${ticket.id}`)
    const asset =
      record.asset_id === null
        ? null
        : assetFixtures.find(({ id }) => id === record.asset_id)
    if (
      record.asset_id !== null &&
      (!asset || asset.companyId !== ticket.companyId)
    )
      throw new Error(`Invalid demo asset for ticket ${ticket.id}`)

    return {
      ticket,
      description: record.description,
      contact: { email: contact.email, phone: contact.phone },
      site: site
        ? { id: site.id, name: site.name, address: formatSiteAddress(site) }
        : null,
      asset: asset
        ? { id: asset.id, name: asset.name, hostname: asset.hostname }
        : null,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      resolvedAt: record.resolved_at,
      notes: demoData.ticket_notes
        .filter((note) => note.ticket_id === ticket.id)
        .map((note) => {
          const noteContact =
            note.contact_id === null
              ? null
              : contactFixtures.find(({ id }) => id === note.contact_id)
          if (note.contact_id !== null && !noteContact)
            throw new Error(`Invalid demo note contact ${note.id}`)
          const author =
            note.user_id !== null
              ? {
                  name: technicianName(note.user_id),
                  kind: "technician" as const,
                }
              : {
                  name: noteContact ? getContactName(noteContact) : null,
                  kind: "contact" as const,
                }
          if (!author.name)
            throw new Error(`Invalid demo note author ${note.id}`)
          return {
            id: note.id,
            type: note.type as TicketDetail["notes"][number]["type"],
            author: { name: author.name, kind: author.kind },
            body: note.body,
            createdAt: note.created_at,
          }
        }),
      timeEntries: demoData.time_entries
        .filter((entry) => entry.ticket_id === ticket.id)
        .map((entry) => {
          const technician = technicianName(entry.user_id)
          if (!technician)
            throw new Error(`Invalid demo time entry user ${entry.id}`)
          return {
            id: entry.id,
            technician,
            ticketNoteId: entry.ticket_note_id,
            startedAt: entry.started_at,
            durationMinutes: entry.duration_minutes,
            description: entry.description,
            billable: entry.billable,
          }
        }),
    }
  },
)

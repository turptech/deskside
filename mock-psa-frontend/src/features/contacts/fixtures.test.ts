import {
  companyFixtures,
  companyOverviews,
} from "@/features/companies/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"
import { ticketFixtures } from "@/features/tickets/fixtures"

describe("synthetic contact relationships", () => {
  it("has unique IDs and reserved emails with valid company and optional site assignments", () => {
    expect(contactFixtures).toHaveLength(8)
    expect(new Set(contactFixtures.map(({ id }) => id)).size).toBe(
      contactFixtures.length,
    )
    expect(new Set(contactFixtures.map(({ email }) => email)).size).toBe(
      contactFixtures.length,
    )
    for (const contact of contactFixtures) {
      expect(contact.email).toMatch(/\.example$/)
      expect(companyFixtures.some(({ id }) => id === contact.companyId)).toBe(
        true,
      )
      if (contact.siteId !== null) {
        expect(
          siteFixtures.find(({ id }) => id === contact.siteId)?.companyId,
        ).toBe(contact.companyId)
      }
      expect(
        companyOverviews
          .find(({ company }) => company.id === contact.companyId)
          ?.contacts.some(({ id }) => id === contact.id),
      ).toBe(true)
    }
  })

  it("resolves each ticket's contact name, email, and phone from one fixture", () => {
    for (const ticket of ticketFixtures) {
      const contact = contactFixtures.find(({ id }) => id === ticket.contactId)
      const detail = ticketDetailFixtures.find(
        ({ ticket: item }) => item.id === ticket.id,
      )
      expect(contact?.companyId).toBe(ticket.companyId)
      expect(contact && getContactName(contact)).toBe(ticket.contact)
      expect(detail?.contact).toEqual({
        email: contact?.email,
        phone: contact?.phone,
      })
    }
  })

  it("keeps Contact site assignment independent from Ticket site assignment", () => {
    const priya = contactFixtures.find(({ id }) => id === 2)
    const branchTicket = ticketDetailFixtures.find(
      ({ ticket }) => ticket.id === 1041,
    )
    expect(priya?.siteId).toBe(2)
    expect(branchTicket?.site?.id).toBe(5)
    expect(branchTicket?.ticket.contactId).toBe(priya?.id)
    expect(contactFixtures.filter(({ siteId }) => siteId === 5)).toEqual([])
  })

  it("includes one contact without tickets on the ticket-empty Durham site", () => {
    const dana = contactFixtures.find(({ id }) => id === 8)
    expect(dana?.siteId).toBe(6)
    expect(ticketFixtures.some(({ contactId }) => contactId === dana?.id)).toBe(
      false,
    )
  })
})

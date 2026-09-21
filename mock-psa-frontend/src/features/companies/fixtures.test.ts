import {
  companyFixtures,
  companyOverviews,
} from "@/features/companies/fixtures"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"
import { ticketFixtures } from "@/features/tickets/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"

describe("synthetic company relationships", () => {
  it("gives each ticket one matching company ID and display name", () => {
    expect(new Set(companyFixtures.map(({ id }) => id)).size).toBe(
      companyFixtures.length,
    )
    expect(companyOverviews).toHaveLength(companyFixtures.length)
    for (const ticket of ticketFixtures) {
      const company = companyFixtures.find(({ id }) => id === ticket.companyId)
      expect(company?.name).toBe(ticket.company)
      expect(
        companyOverviews.find(
          ({ company: item }) => item.id === ticket.companyId,
        )?.tickets,
      ).toContain(ticket)
    }
  })

  it("derives only matching demo relationships and deduplicates repeated contacts", () => {
    const northstar = companyOverviews.find(({ company }) => company.id === 1)
    const juniper = companyOverviews.find(({ company }) => company.id === 2)
    expect(northstar?.tickets.map(({ id }) => id)).toEqual([1048, 1043])
    expect(northstar?.contacts.map(({ name }) => name)).toEqual([
      "Morgan Lee",
      "Jamie Patel",
    ])
    expect(juniper?.tickets.map(({ id }) => id)).toEqual([1047, 1041])
    expect(juniper?.contacts.map(({ name }) => name)).toEqual(["Priya Shah"])

    for (const overview of companyOverviews) {
      const details = ticketDetailFixtures.filter(
        ({ ticket }) => ticket.companyId === overview.company.id,
      )
      expect(overview.tickets).toHaveLength(details.length)
      expect(new Set(overview.contacts.map(({ email }) => email)).size).toBe(
        overview.contacts.length,
      )
      expect(new Set(overview.sites.map(({ name }) => name)).size).toBe(
        overview.sites.length,
      )
      expect(overview.sites.map(({ id }) => id)).toEqual(
        siteFixtures
          .filter(({ companyId }) => companyId === overview.company.id)
          .map(({ id }) => id),
      )
      expect(new Set(overview.assets.map(({ name }) => name)).size).toBe(
        overview.assets.length,
      )
      expect(
        overview.contacts.every(({ email }) => email.endsWith(".example")),
      ).toBe(true)
    }
  })

  it("includes an intentionally empty company for the overview empty states", () => {
    const empty = companyOverviews.find(({ company }) => company.id === 6)
    expect(empty).toMatchObject({
      tickets: [],
      contacts: [],
      sites: [],
      assets: [],
    })
  })
})

import {
  companyFixtures,
  companyOverviews,
} from "@/features/companies/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { formatSiteAddress } from "@/features/sites/site-format"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"

describe("synthetic site relationships", () => {
  it("has stable IDs, valid parent companies, and one canonical site for each linked ticket", () => {
    expect(siteFixtures).toHaveLength(6)
    expect(new Set(siteFixtures.map(({ id }) => id)).size).toBe(
      siteFixtures.length,
    )
    for (const site of siteFixtures) {
      expect(companyFixtures.some(({ id }) => id === site.companyId)).toBe(true)
      expect(
        companyOverviews
          .find(({ company }) => company.id === site.companyId)
          ?.sites.some(({ id }) => id === site.id),
      ).toBe(true)
    }
    for (const detail of ticketDetailFixtures) {
      if (!detail.site) continue
      const site = siteFixtures.find(({ id }) => id === detail.site?.id)
      expect(site?.companyId).toBe(detail.ticket.companyId)
      expect(detail.site).toEqual({
        id: site?.id,
        name: site?.name,
        address: site && formatSiteAddress(site),
      })
    }
  })

  it("includes one site with no assigned demo tickets", () => {
    const site = siteFixtures.find(({ id }) => id === 6)
    expect(site?.name).toBe("Durham studio")
    expect(
      ticketDetailFixtures.some(({ site: linked }) => linked?.id === site?.id),
    ).toBe(false)
  })
})

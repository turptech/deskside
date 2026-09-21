import { assetFixtures } from "@/features/assets/fixtures"
import { assetRecords } from "@/features/assets/asset-records"
import { companyOverviews } from "@/features/companies/fixtures"
import { contactFixtures } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"

describe("synthetic asset relationships", () => {
  it("has unique IDs and company-owned, exclusive assignments", () => {
    expect(assetFixtures).toHaveLength(8)
    expect(new Set(assetFixtures.map(({ id }) => id)).size).toBe(8)
    expect(new Set(assetFixtures.map(({ assetTag }) => assetTag)).size).toBe(8)
    expect(assetRecords.map(({ asset }) => asset.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    for (const { asset, company, site, contact } of assetRecords) {
      expect(company.id).toBe(asset.companyId)
      expect(Boolean(site && contact)).toBe(false)
      if (asset.siteId !== null) {
        expect(siteFixtures.find(({ id }) => id === asset.siteId)).toBe(site)
        expect(site?.companyId).toBe(company.id)
      }
      if (asset.contactId !== null) {
        expect(contactFixtures.find(({ id }) => id === asset.contactId)).toBe(
          contact,
        )
        expect(contact?.companyId).toBe(company.id)
      }
    }
  })

  it("resolves ticket Assets from canonical records and keeps Company inventory complete", () => {
    expect(
      ticketDetailFixtures.map(({ ticket, asset }) => [
        ticket.id,
        asset?.id ?? null,
      ]),
    ).toEqual([
      [1048, 1],
      [1047, 2],
      [1046, 3],
      [1045, null],
      [1044, 4],
      [1043, null],
      [1042, 5],
      [1041, 6],
    ])
    for (const { ticket, asset } of ticketDetailFixtures) {
      if (!asset) continue
      const canonical = assetFixtures.find(({ id }) => id === asset.id)
      expect(asset).toEqual({
        id: canonical?.id,
        name: canonical?.name,
        hostname: canonical?.hostname,
      })
      expect(canonical?.companyId).toBe(ticket.companyId)
    }
    for (const overview of companyOverviews) {
      expect(overview.assets.map(({ id }) => id)).toEqual(
        assetFixtures
          .filter(({ companyId }) => companyId === overview.company.id)
          .map(({ id }) => id),
      )
    }
    expect(
      companyOverviews.find(({ company }) => company.id === 1)?.assets,
    ).toHaveLength(3)
  })

  it("does not infer Asset assignments from ticket or Contact Sites", () => {
    const phone = assetFixtures.find(({ id }) => id === 5)
    expect(phone).toMatchObject({ companyId: 3, siteId: null, contactId: 7 })
    const resolver = assetFixtures.find(({ id }) => id === 6)
    expect(resolver).toMatchObject({ companyId: 2, siteId: 5, contactId: null })
    expect(contactFixtures.find(({ id }) => id === 2)?.siteId).toBe(2)
    expect(assetFixtures.find(({ id }) => id === 7)).toMatchObject({
      siteId: null,
      contactId: null,
      status: "in_stock",
    })
    expect(
      ticketDetailFixtures.filter(({ asset }) => asset?.id === 8),
    ).toHaveLength(0)
  })
})

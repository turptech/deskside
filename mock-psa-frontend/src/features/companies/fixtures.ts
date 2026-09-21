import type {
  CompanyOverview,
  CompanySummary,
} from "@/features/companies/types"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"

/** Stable synthetic identities; only id and name are Company API fields. */
export const companyFixtures: CompanySummary[] = [
  { id: 1, name: "Northstar Architecture" },
  { id: 2, name: "Juniper Dental Group" },
  { id: 3, name: "Crescent Supply Co." },
  { id: 4, name: "Beacon Financial Partners" },
  { id: 5, name: "Hawthorne Legal" },
  { id: 6, name: "Summit Design Studio" },
]

/** Related records are the sample visible on demo tickets, not a full inventory. */
export const companyOverviews: CompanyOverview[] = companyFixtures.map(
  (company) => {
    const details = ticketDetailFixtures.filter(
      ({ ticket }) => ticket.companyId === company.id,
    )
    const contacts = new Map<string, CompanyOverview["contacts"][number]>()
    const sites = new Map<string, CompanyOverview["sites"][number]>()
    const assets = new Map<string, CompanyOverview["assets"][number]>()

    for (const detail of details) {
      const { ticket, contact, site, asset } = detail
      contacts.set(contact.email.toLowerCase(), {
        name: ticket.contact,
        email: contact.email,
        phone: contact.phone,
      })
      if (site) {
        sites.set(site.name.toLowerCase(), {
          name: site.name,
          address: site.address,
        })
      }
      if (asset) {
        assets.set((asset.hostname ?? asset.name).toLowerCase(), {
          name: asset.name,
          hostname: asset.hostname,
        })
      }
    }

    return {
      company,
      tickets: details.map(({ ticket }) => ticket),
      contacts: [...contacts.values()],
      sites: [...sites.values()],
      assets: [...assets.values()],
    }
  },
)

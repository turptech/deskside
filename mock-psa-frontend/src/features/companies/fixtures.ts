import type {
  CompanyOverview,
  CompanySummary,
} from "@/features/companies/types"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { formatSiteAddress } from "@/features/sites/site-format"
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

/** Related records are a synthetic sample, not a full inventory. */
export const companyOverviews: CompanyOverview[] = companyFixtures.map(
  (company) => {
    const details = ticketDetailFixtures.filter(
      ({ ticket }) => ticket.companyId === company.id,
    )
    const assets = new Map<string, CompanyOverview["assets"][number]>()

    for (const detail of details) {
      const { asset } = detail
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
      contacts: contactFixtures
        .filter((contact) => contact.companyId === company.id)
        .map((contact) => ({
          id: contact.id,
          name: getContactName(contact),
          email: contact.email,
          phone: contact.phone,
        })),
      sites: siteFixtures
        .filter((site) => site.companyId === company.id)
        .map((site) => ({
          id: site.id,
          name: site.name,
          address: formatSiteAddress(site),
        })),
      assets: [...assets.values()],
    }
  },
)

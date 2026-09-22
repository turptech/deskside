import { demoData } from "@/demo-data"
import { assetFixtures } from "@/features/assets/fixtures"
import type {
  CompanyOverview,
  CompanySummary,
} from "@/features/companies/types"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { formatSiteAddress } from "@/features/sites/site-format"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"

export const companyFixtures: CompanySummary[] = demoData.companies.map(
  ({ id, name }) => ({ id, name }),
)

/** Related records are a synthetic sample, not a full inventory. */
export const companyOverviews: CompanyOverview[] = companyFixtures.map(
  (company) => {
    const details = ticketDetailFixtures.filter(
      ({ ticket }) => ticket.companyId === company.id,
    )
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
      assets: assetFixtures
        .filter((asset) => asset.companyId === company.id)
        .map(({ id, name, hostname }) => ({ id, name, hostname })),
    }
  },
)

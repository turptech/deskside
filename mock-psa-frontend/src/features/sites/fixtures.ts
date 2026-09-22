import { demoData } from "@/demo-data"
import type { SiteDetail } from "@/features/sites/types"

export const siteFixtures: SiteDetail[] = demoData.sites.map((site) => ({
  id: site.id,
  companyId: site.company_id,
  name: site.name,
  addressLine1: site.address_line1,
  addressLine2: site.address_line2,
  city: site.city,
  stateProvince: site.state_province,
  postalCode: site.postal_code,
  countryCode: site.country_code,
  phone: site.phone,
  timezone: site.timezone,
}))

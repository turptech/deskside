import type { SiteDetail } from "@/features/sites/types"

/** Human-readable address projection; country code is shown separately. */
export function formatSiteAddress(site: SiteDetail): string | null {
  const region = [site.stateProvince, site.postalCode].filter(Boolean).join(" ")
  const locality = [site.city, region].filter(Boolean).join(", ")
  const address = [site.addressLine1, site.addressLine2, locality]
    .filter(Boolean)
    .join(", ")
  return address || null
}

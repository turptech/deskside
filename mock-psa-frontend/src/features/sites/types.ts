/** Frontend-only synthetic Site profile, not the FastAPI SiteRead wire type. */
export type SiteDetail = {
  id: number
  companyId: number
  name: string
  addressLine1: string | null
  addressLine2: string | null
  city: string | null
  stateProvince: string | null
  postalCode: string | null
  countryCode: string | null
  phone: string | null
  timezone: string | null
}

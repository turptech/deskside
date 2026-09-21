/** Frontend-only synthetic Contact profile, not the FastAPI ContactRead wire type. */
export type ContactDetail = {
  id: number
  companyId: number
  siteId: number | null
  firstName: string
  lastName: string
  email: string
  phone: string | null
  mobilePhone: string | null
  jobTitle: string | null
}

import type { TicketSummary } from "@/features/tickets/types"

/** Display models for the synthetic company workspace, not API wire types. */
export type CompanySummary = {
  id: number
  name: string
}

export type CompanyContact = {
  name: string
  email: string
  phone: string | null
}

export type CompanySite = {
  name: string
  address: string | null
}

export type CompanyAsset = {
  name: string
  hostname: string | null
}

export type CompanyOverview = {
  company: CompanySummary
  tickets: TicketSummary[]
  contacts: CompanyContact[]
  sites: CompanySite[]
  assets: CompanyAsset[]
}

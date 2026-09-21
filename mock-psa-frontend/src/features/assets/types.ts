export type AssetType =
  | "laptop"
  | "desktop"
  | "server"
  | "network_device"
  | "printer"
  | "mobile_device"
  | "other"

export type AssetStatus =
  "active" | "inactive" | "in_stock" | "maintenance" | "retired"

/** Synthetic, frontend-only display model; not an Asset API wire type. */
export type AssetDetail = {
  id: number
  companyId: number
  siteId: number | null
  contactId: number | null
  name: string
  assetType: AssetType
  status: AssetStatus
  manufacturer: string | null
  model: string | null
  serialNumber: string | null
  assetTag: string | null
  hostname: string | null
  operatingSystem: string | null
}

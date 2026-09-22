import { demoData } from "@/demo-data"
import type { AssetDetail } from "@/features/assets/types"

export const assetFixtures: AssetDetail[] = demoData.assets.map((asset) => ({
  id: asset.id,
  companyId: asset.company_id,
  siteId: asset.site_id,
  contactId: asset.contact_id,
  name: asset.name,
  assetType: asset.asset_type as AssetDetail["assetType"],
  status: asset.status as AssetDetail["status"],
  manufacturer: asset.manufacturer,
  model: asset.model,
  serialNumber: asset.serial_number,
  assetTag: asset.asset_tag,
  hostname: asset.hostname,
  operatingSystem: asset.operating_system,
}))

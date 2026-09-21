import type { AssetStatus, AssetType } from "@/features/assets/types"

export const assetTypeLabels: Record<AssetType, string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  server: "Server",
  network_device: "Network device",
  printer: "Printer",
  mobile_device: "Mobile device",
  other: "Other",
}

export const assetStatusLabels: Record<AssetStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  in_stock: "In stock",
  maintenance: "Maintenance",
  retired: "Retired",
}

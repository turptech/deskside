import { Badge } from "@/components/ui/badge"
import { assetStatusLabels } from "@/features/assets/asset-format"
import type { AssetStatus } from "@/features/assets/types"
import { cn } from "@/lib/utils"

const statusStyles: Record<AssetStatus, string> = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  inactive: "border-border bg-muted text-muted-foreground",
  in_stock:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  maintenance:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  retired: "border-border bg-muted text-muted-foreground",
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", statusStyles[status])}
    >
      {assetStatusLabels[status]}
    </Badge>
  )
}

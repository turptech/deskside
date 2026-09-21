import { HardDrive } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  assetStatusLabels,
  assetTypeLabels,
} from "@/features/assets/asset-format"
import type { AssetDetail } from "@/features/assets/types"

export function AssignedAssetsCard({
  assets,
  owner,
}: {
  assets: AssetDetail[]
  owner: "site" | "contact"
}) {
  return (
    <Card className="min-w-0 shadow-xs">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <HardDrive className="size-4 text-muted-foreground" />
              Assigned assets
            </h2>
          </CardTitle>
          <Badge variant="secondary" className="font-normal">
            {assets.length} in demo sample
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length > 0 ? (
          <ul className="divide-y">
            {assets.map((asset) => (
              <li key={asset.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
                <Link
                  to={`/assets/${asset.id}`}
                  aria-label={`Open asset #${asset.id}: ${asset.name}`}
                  className="rounded-sm text-sm font-medium underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {asset.name}
                </Link>
                <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">
                  {assetTypeLabels[asset.assetType]} ·{" "}
                  {assetStatusLabels[asset.status]}
                  {asset.hostname ? ` · ${asset.hostname}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-5 text-sm text-muted-foreground">
            No assets assigned to this {owner} in this demo sample.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

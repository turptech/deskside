import {
  ArrowLeft,
  Building2,
  Fingerprint,
  HardDrive,
  Ticket,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssetStatusBadge } from "@/features/assets/asset-badges"
import { assetTypeLabels } from "@/features/assets/asset-format"
import { assetRecords } from "@/features/assets/asset-records"
import { getContactName } from "@/features/contacts/fixtures"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"
import { TicketTable } from "@/features/tickets/ticket-table"

function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 wrap-anywhere text-sm font-medium">{children}</dd>
    </div>
  )
}

export function AssetDetailPage() {
  const { assetId } = useParams()
  const record =
    assetId && /^[1-9]\d*$/.test(assetId)
      ? assetRecords.find(({ asset }) => String(asset.id) === assetId)
      : undefined

  if (!record) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <HardDrive className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Asset not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This asset is not part of the synthetic demo inventory.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/assets">
            <ArrowLeft />
            Back to assets
          </Link>
        </Button>
      </section>
    )
  }

  const { asset, company, site, contact } = record
  const tickets = ticketDetailFixtures
    .filter(({ asset: ticketAsset }) => ticketAsset?.id === asset.id)
    .map(({ ticket }) => ticket)

  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to="/assets"
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to assets
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            ASSET #{asset.id}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {asset.name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {assetTypeLabels[asset.assetType]}
          </Badge>
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <HardDrive className="size-4 text-muted-foreground" />
                Asset details
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 @min-[28rem]:grid-cols-2">
              <DetailField label="Asset ID">#{asset.id}</DetailField>
              <DetailField label="Asset name">{asset.name}</DetailField>
              <DetailField label="Type">
                {assetTypeLabels[asset.assetType]}
              </DetailField>
              <DetailField label="Status">
                <AssetStatusBadge status={asset.status} />
              </DetailField>
              <DetailField label="Manufacturer">
                {asset.manufacturer ?? "Not provided"}
              </DetailField>
              <DetailField label="Model">
                {asset.model ?? "Not provided"}
              </DetailField>
              <div className="@min-[28rem]:col-span-2">
                <DetailField label="Operating system">
                  {asset.operatingSystem ?? "Not provided"}
                </DetailField>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-muted-foreground" />
                Customer context
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Company">
                <Link
                  to={`/companies/${company.id}`}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {company.name}
                </Link>
              </DetailField>
              <DetailField label="Assigned site">
                {site ? (
                  <Link
                    to={`/sites/${site.id}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {site.name}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </DetailField>
              <DetailField label="Assigned contact">
                {contact ? (
                  <Link
                    to={`/contacts/${contact.id}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {getContactName(contact)}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </DetailField>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Fingerprint className="size-4 text-muted-foreground" />
              Identifiers
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 @min-[32rem]:grid-cols-2">
            <DetailField label="Asset tag">
              {asset.assetTag ?? "Not provided"}
            </DetailField>
            <DetailField label="Serial number">
              {asset.serialNumber ?? "Not provided"}
            </DetailField>
            <DetailField label="Hostname">
              {asset.hostname ?? "Not provided"}
            </DetailField>
          </dl>
        </CardContent>
      </Card>

      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Ticket className="size-4 text-muted-foreground" />
                Related tickets
              </h2>
            </CardTitle>
            <Badge variant="secondary" className="font-normal">
              {tickets.length} in demo sample
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {tickets.length > 0 ? (
            <TicketTable tickets={tickets} ariaLabel="Asset tickets" />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tickets linked to this asset in this demo sample.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-[11px] text-muted-foreground">
        Read-only synthetic workspace · Related counts reflect this demo sample
      </p>
    </section>
  )
}

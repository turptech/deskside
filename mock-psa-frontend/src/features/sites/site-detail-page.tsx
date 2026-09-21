import { ArrowLeft, Building2, MapPin, Phone, Ticket } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { companyFixtures } from "@/features/companies/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { formatSiteAddress } from "@/features/sites/site-format"
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

export function SiteDetailPage() {
  const { siteId } = useParams()
  const site =
    siteId && /^[1-9]\d*$/.test(siteId)
      ? siteFixtures.find(({ id }) => String(id) === siteId)
      : undefined
  const company = site
    ? companyFixtures.find(({ id }) => id === site.companyId)
    : undefined

  if (!site || !company) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <MapPin className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Site not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This site is not part of the synthetic demo workspace.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/companies">
            <ArrowLeft />
            Back to companies
          </Link>
        </Button>
      </section>
    )
  }

  const address = formatSiteAddress(site)
  const tickets = ticketDetailFixtures
    .filter(({ site: ticketSite }) => ticketSite?.id === site.id)
    .map(({ ticket }) => ticket)

  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to={`/companies/${company.id}`}
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to company
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            SITE #{site.id}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {site.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Site profile and assigned service tickets
        </p>
      </div>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="size-4 text-muted-foreground" />
                Site details
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <DetailField label="Site name">{site.name}</DetailField>
              <DetailField label="Site ID">#{site.id}</DetailField>
              <DetailField label="Company">
                <Link
                  to={`/companies/${company.id}`}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {company.name}
                </Link>
              </DetailField>
            </dl>
          </CardContent>
        </Card>

        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="size-4 text-muted-foreground" />
                Location and contact
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 @min-[28rem]:grid-cols-2">
              <div className="@min-[28rem]:col-span-2">
                <DetailField label="Address">
                  {address ?? "Not provided"}
                </DetailField>
              </div>
              <DetailField label="Country code">
                {site.countryCode ?? "Not provided"}
              </DetailField>
              <DetailField label="Phone">
                {site.phone ?? "Not provided"}
              </DetailField>
              <div className="@min-[28rem]:col-span-2">
                <DetailField label="Timezone">
                  {site.timezone ?? "Not provided"}
                </DetailField>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

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
            <TicketTable tickets={tickets} ariaLabel="Site tickets" />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tickets assigned to this site in this demo sample.
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

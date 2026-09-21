import {
  ArrowLeft,
  Building2,
  ContactRound,
  HardDrive,
  MapPin,
  Ticket,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { companyOverviews } from "@/features/companies/fixtures"
import type {
  CompanyAsset,
  CompanyContact,
  CompanySite,
} from "@/features/companies/types"
import { TicketTable } from "@/features/tickets/ticket-table"

function RelatedCard({
  title,
  icon,
  empty,
  children,
}: {
  title: string
  icon: ReactNode
  empty: boolean
  children: ReactNode
}) {
  return (
    <Card className="min-w-0 shadow-xs">
      <CardHeader className="border-b">
        <CardTitle>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            {icon}
            {title}
          </h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="py-5 text-sm text-muted-foreground">
            No {title.toLowerCase()} in this demo sample.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}

function RecordList({
  records,
  detail,
  renderName,
}: {
  records: Array<CompanyContact | CompanySite | CompanyAsset>
  detail: (record: CompanyContact | CompanySite | CompanyAsset) => ReactNode
  renderName?: (
    record: CompanyContact | CompanySite | CompanyAsset,
  ) => ReactNode
}) {
  return (
    <ul className="divide-y">
      {records.map((record) => (
        <li key={record.id} className="min-w-0 py-3 first:pt-0 last:pb-0">
          <p className="wrap-anywhere text-sm font-medium">
            {renderName ? renderName(record) : record.name}
          </p>
          <p className="mt-1 wrap-anywhere text-xs text-muted-foreground">
            {detail(record)}
          </p>
        </li>
      ))}
    </ul>
  )
}

export function CompanyDetailPage() {
  const { companyId } = useParams()
  const overview =
    companyId && /^[1-9]\d*$/.test(companyId)
      ? companyOverviews.find(({ company }) => String(company.id) === companyId)
      : undefined

  if (!overview) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <Building2 className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Company not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This company is not part of the synthetic demo directory.
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

  const { company, tickets, contacts, sites, assets } = overview
  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to="/companies"
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to companies
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            COMPANY #{company.id}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {company.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Company profile and related service records
        </p>
      </div>

      <Card className="shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4 text-muted-foreground" />
              Company details
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-5 @min-[30rem]:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Company name</dt>
              <dd className="mt-1.5 wrap-anywhere text-sm font-medium">
                {company.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Company ID</dt>
              <dd className="mt-1.5 font-mono text-sm font-medium">
                #{company.id}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Related records
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Only records represented in this synthetic demo sample are shown.
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 @min-[40rem]:grid-cols-4">
          {[
            ["Tickets", tickets.length],
            ["Contacts", contacts.length],
            ["Sites", sites.length],
            ["Assets", assets.length],
          ].map(([label, count]) => (
            <div
              key={label}
              className="rounded-xl border bg-card p-4 shadow-xs"
            >
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight">
                {count}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="border-b">
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Ticket className="size-4 text-muted-foreground" />
              Tickets
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {tickets.length > 0 ? (
            <TicketTable tickets={tickets} ariaLabel="Company tickets" />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tickets in this demo sample.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2 @min-[46rem]:grid-cols-3">
        <RelatedCard
          title="Contacts"
          icon={<ContactRound className="size-4 text-muted-foreground" />}
          empty={contacts.length === 0}
        >
          <RecordList
            records={contacts}
            renderName={(record) =>
              "email" in record ? (
                <Link
                  to={`/contacts/${record.id}`}
                  aria-label={`Open contact #${record.id}: ${record.name}`}
                  className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {record.name}
                </Link>
              ) : (
                record.name
              )
            }
            detail={(record) =>
              "email" in record ? (
                <>
                  {record.email}
                  {record.phone && (
                    <span className="block">{record.phone}</span>
                  )}
                </>
              ) : null
            }
          />
        </RelatedCard>
        <RelatedCard
          title="Sites"
          icon={<MapPin className="size-4 text-muted-foreground" />}
          empty={sites.length === 0}
        >
          <RecordList
            records={sites}
            renderName={(record) =>
              "address" in record ? (
                <Link
                  to={`/sites/${record.id}`}
                  aria-label={`Open site #${record.id}: ${record.name}`}
                  className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {record.name}
                </Link>
              ) : (
                record.name
              )
            }
            detail={(record) =>
              "address" in record
                ? (record.address ?? "Address not provided")
                : null
            }
          />
        </RelatedCard>
        <RelatedCard
          title="Assets"
          icon={<HardDrive className="size-4 text-muted-foreground" />}
          empty={assets.length === 0}
        >
          <RecordList
            records={assets}
            renderName={(record) =>
              "hostname" in record ? (
                <Link
                  to={`/assets/${record.id}`}
                  aria-label={`Open asset #${record.id}: ${record.name}`}
                  className="rounded-sm underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {record.name}
                </Link>
              ) : (
                record.name
              )
            }
            detail={(record) =>
              "hostname" in record
                ? (record.hostname ?? "Hostname not provided")
                : null
            }
          />
        </RelatedCard>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">
        Read-only synthetic workspace · Related counts reflect this demo sample
      </p>
    </section>
  )
}

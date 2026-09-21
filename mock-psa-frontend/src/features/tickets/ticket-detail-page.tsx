import { ArrowLeft, Building2, FileText, Ticket, TicketX } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"
import { TicketActivity } from "@/features/tickets/ticket-activity"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/features/tickets/ticket-badges"
import { formatTicketTimestamp } from "@/features/tickets/ticket-format"
import type { TicketSource } from "@/features/tickets/types"

const sourceLabels: Record<TicketSource, string> = {
  phone: "Phone",
  email: "Email",
  portal: "Portal",
  monitoring: "Monitoring",
  other: "Other",
}

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

function Timestamp({ value }: { value: string }) {
  return (
    <time dateTime={value} className="text-xs font-normal">
      {formatTicketTimestamp(value)}
    </time>
  )
}

export function TicketDetailPage() {
  const { ticketId } = useParams()
  const detail =
    ticketId && /^[1-9]\d*$/.test(ticketId)
      ? ticketDetailFixtures.find(
          ({ ticket }) => String(ticket.id) === ticketId,
        )
      : undefined

  if (!detail) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <TicketX className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Ticket not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This ticket is not part of the synthetic demo queue.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/tickets">
            <ArrowLeft />
            Back to tickets
          </Link>
        </Button>
      </section>
    )
  }

  const { ticket } = detail
  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to tickets
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            TICKET #{ticket.id}
          </span>
          <TicketStatusBadge status={ticket.status} />
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {ticket.summary}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ticket.company} <span aria-hidden="true">·</span> {ticket.contact}
        </p>
      </div>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Ticket className="size-4 text-muted-foreground" />
                Ticket details
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <DetailField label="Status">
                <TicketStatusBadge status={ticket.status} />
              </DetailField>
              <DetailField label="Priority">
                <TicketPriorityBadge priority={ticket.priority} />
              </DetailField>
              <DetailField label="Source">
                {sourceLabels[ticket.source]}
              </DetailField>
              <DetailField label="Assigned technician">
                {ticket.assignee ?? "Unassigned"}
              </DetailField>
              <DetailField label="Created">
                <Timestamp value={detail.createdAt} />
              </DetailField>
              <DetailField label="Updated">
                <Timestamp value={detail.updatedAt} />
              </DetailField>
              {detail.resolvedAt && (
                <DetailField label="Resolved">
                  <Timestamp value={detail.resolvedAt} />
                </DetailField>
              )}
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
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <DetailField label="Company">
                <Link
                  to={`/companies/${ticket.companyId}`}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ticket.company}
                </Link>
              </DetailField>
              <DetailField label="Contact">
                <Link
                  to={`/contacts/${ticket.contactId}`}
                  className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ticket.contact}
                </Link>
              </DetailField>
              <div className="col-span-2">
                <DetailField label="Email">{detail.contact.email}</DetailField>
              </div>
              <DetailField label="Phone">
                {detail.contact.phone ?? "Not provided"}
              </DetailField>
              <DetailField label="Site">
                {detail.site ? (
                  <Link
                    to={`/sites/${detail.site.id}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {detail.site.name}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </DetailField>
              {detail.site?.address && (
                <div className="col-span-2">
                  <DetailField label="Site address">
                    {detail.site.address}
                  </DetailField>
                </div>
              )}
              <div className="col-span-2">
                <DetailField label="Linked asset">
                  {detail.asset?.name ?? "Not linked"}
                  {detail.asset?.hostname && (
                    <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground">
                      {detail.asset.hostname}
                    </span>
                  )}
                </DetailField>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="size-4 text-muted-foreground" />
              Description
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap wrap-anywhere text-sm leading-6 text-foreground/85">
            {detail.description ?? "No description provided."}
          </p>
        </CardContent>
      </Card>
      <TicketActivity detail={detail} />
      <p className="text-center text-[11px] text-muted-foreground">
        Read-only synthetic workspace · All timestamps shown in UTC
      </p>
    </section>
  )
}

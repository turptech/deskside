import { ArrowLeft, Building2, FileText, Ticket, TicketX } from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { useApiClient } from "@/api/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { assetFixtures } from "@/features/assets/fixtures"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { TicketActivity } from "@/features/tickets/ticket-activity"
import {
  fetchTicket,
  fetchTicketWorkspace,
  TicketRequestError,
} from "@/features/tickets/ticket-api"
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
  const id = ticketId && /^[1-9]\d*$/.test(ticketId) ? Number(ticketId) : null
  const validId = id !== null && Number.isSafeInteger(id)
  const api = useApiClient()
  const cache = useQueryClient()
  const ticketQuery = useQuery({
    queryKey: ["ticket", id],
    queryFn: ({ signal }) => fetchTicket(api, id!, signal),
    enabled: validId,
    retry: false,
  })
  const workspaceQuery = useQuery({
    queryKey: ["ticket-workspace", id],
    queryFn: () => fetchTicketWorkspace(api, cache, ticketQuery.data!),
    enabled: Boolean(ticketQuery.data),
    retry: false,
  })
  const detail = workspaceQuery.data

  if (
    !validId ||
    (ticketQuery.error instanceof TicketRequestError &&
      ticketQuery.error.status === 404)
  ) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <TicketX className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Ticket not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The API does not have a ticket with this ID.
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

  if (ticketQuery.isError || workspaceQuery.isError) {
    return (
      <section
        role="alert"
        className="flex min-h-96 flex-col items-center justify-center px-6 text-center"
      >
        <TicketX className="size-7 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Unable to load ticket</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The ticket workspace could not be loaded from the API.
        </p>
        <Button
          variant="outline"
          className="mt-5"
          onClick={() =>
            void (ticketQuery.isError
              ? ticketQuery.refetch()
              : workspaceQuery.refetch())
          }
        >
          Try again
        </Button>
      </section>
    )
  }

  if (!detail) {
    return (
      <section
        aria-label="Loading ticket details"
        className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8"
      >
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-3/4" />
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <Skeleton className="h-36" />
      </section>
    )
  }

  const { ticket } = detail
  const companyPreview = companyFixtures.some(
    ({ id }) => id === ticket.companyId,
  )
  const contactPreview = contactFixtures.some(
    ({ id }) => id === ticket.contactId,
  )
  const sitePreview =
    detail.site && siteFixtures.some(({ id }) => id === detail.site?.id)
  const assetPreview =
    detail.asset && assetFixtures.some(({ id }) => id === detail.asset?.id)
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
            Live API data
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
                {companyPreview ? (
                  <Link
                    to={`/companies/${ticket.companyId}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ticket.company}
                  </Link>
                ) : (
                  ticket.company
                )}
                {companyPreview && (
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    · demo preview
                  </span>
                )}
              </DetailField>
              <DetailField label="Contact">
                {contactPreview ? (
                  <Link
                    to={`/contacts/${ticket.contactId}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {ticket.contact}
                  </Link>
                ) : (
                  ticket.contact
                )}
                {contactPreview && (
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    · demo preview
                  </span>
                )}
              </DetailField>
              <div className="col-span-2">
                <DetailField label="Email">{detail.contact.email}</DetailField>
              </div>
              <DetailField label="Phone">
                {detail.contact.phone ?? "Not provided"}
              </DetailField>
              <DetailField label="Site">
                {detail.site && sitePreview ? (
                  <Link
                    to={`/sites/${detail.site.id}`}
                    className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {detail.site.name}
                  </Link>
                ) : detail.site ? (
                  detail.site.name
                ) : (
                  "Not linked"
                )}
                {sitePreview && (
                  <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                    · demo preview
                  </span>
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
                  {detail.asset && assetPreview ? (
                    <Link
                      to={`/assets/${detail.asset.id}`}
                      className="rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {detail.asset.name}
                    </Link>
                  ) : detail.asset ? (
                    detail.asset.name
                  ) : (
                    "Not linked"
                  )}
                  {assetPreview && (
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      · demo preview
                    </span>
                  )}
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
        Read-only API workspace · All timestamps shown in UTC · Linked profile
        previews remain synthetic
      </p>
    </section>
  )
}

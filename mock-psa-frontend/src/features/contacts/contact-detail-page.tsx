import {
  ArrowLeft,
  Building2,
  ContactRound,
  MapPin,
  Ticket,
} from "lucide-react"
import type { ReactNode } from "react"
import { Link, useParams } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import { siteFixtures } from "@/features/sites/fixtures"
import { ticketFixtures } from "@/features/tickets/fixtures"
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

export function ContactDetailPage() {
  const { contactId } = useParams()
  const contact =
    contactId && /^[1-9]\d*$/.test(contactId)
      ? contactFixtures.find(({ id }) => String(id) === contactId)
      : undefined
  const company = contact
    ? companyFixtures.find(({ id }) => id === contact.companyId)
    : undefined
  const site =
    contact?.siteId == null
      ? null
      : siteFixtures.find(({ id }) => id === contact.siteId)

  if (
    !contact ||
    !company ||
    (contact.siteId !== null && (!site || site.companyId !== contact.companyId))
  ) {
    return (
      <section className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl border bg-card">
          <ContactRound className="size-5 text-muted-foreground" />
        </div>
        <h1 className="mt-5 text-xl font-semibold">Contact not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This contact is not part of the synthetic demo directory.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link to="/contacts">
            <ArrowLeft />
            Back to contacts
          </Link>
        </Button>
      </section>
    )
  }

  const tickets = ticketFixtures.filter(
    ({ contactId: id }) => id === contact.id,
  )

  return (
    <section className="@container mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <Link
          to="/contacts"
          className="inline-flex items-center gap-2 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" />
          Back to contacts
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-xs font-semibold text-primary">
            CONTACT #{contact.id}
          </span>
          <Badge
            variant="outline"
            className="font-normal text-muted-foreground"
          >
            Synthetic demo data
          </Badge>
        </div>
        <h1 className="mt-3 wrap-anywhere text-2xl font-semibold tracking-tight sm:text-3xl">
          {getContactName(contact)}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {contact.jobTitle ?? "Customer contact"}
        </p>
      </div>

      <div className="grid gap-5 @min-[40rem]:grid-cols-2">
        <Card className="min-w-0 shadow-xs">
          <CardHeader className="border-b">
            <CardTitle>
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <ContactRound className="size-4 text-muted-foreground" />
                Contact details
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 @min-[28rem]:grid-cols-2">
              <DetailField label="Contact ID">#{contact.id}</DetailField>
              <DetailField label="Job title">
                {contact.jobTitle ?? "Not provided"}
              </DetailField>
              <DetailField label="First name">{contact.firstName}</DetailField>
              <DetailField label="Last name">{contact.lastName}</DetailField>
              <div className="@min-[28rem]:col-span-2">
                <DetailField label="Email">{contact.email}</DetailField>
              </div>
              <DetailField label="Phone">
                {contact.phone ?? "Not provided"}
              </DetailField>
              <DetailField label="Mobile phone">
                {contact.mobilePhone ?? "Not provided"}
              </DetailField>
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
              <DetailField label="Site">
                {site ? (
                  <Link
                    to={`/sites/${site.id}`}
                    className="inline-flex items-center gap-1.5 rounded-sm text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {site.name}
                  </Link>
                ) : (
                  "Not linked"
                )}
              </DetailField>
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
            <TicketTable tickets={tickets} ariaLabel="Contact tickets" />
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No tickets linked to this contact in this demo sample.
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

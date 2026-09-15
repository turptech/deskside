import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilterX,
  Search,
  TicketCheck,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getStatusLabel } from "@/features/tickets/ticket-badges"
import { ticketFixtures } from "@/features/tickets/fixtures"
import { TicketTable } from "@/features/tickets/ticket-table"
import type { TicketStatus } from "@/features/tickets/types"

type StatusFilter = "all" | TicketStatus

const filterStatuses: StatusFilter[] = [
  "all",
  "new",
  "open",
  "in_progress",
  "waiting_customer",
  "resolved",
  "closed",
]

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string
  value: number
  helper: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">{helper}</p>
    </div>
  )
}

export function TicketQueuePage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return ticketFixtures.filter((ticket) => {
      const matchesStatus = status === "all" || ticket.status === status
      const searchableText = [
        ticket.id,
        ticket.summary,
        ticket.company,
        ticket.contact,
      ]
        .join(" ")
        .toLowerCase()

      return matchesStatus && searchableText.includes(normalizedSearch)
    })
  }, [search, status])

  const activeCount = ticketFixtures.filter(
    ({ status: ticketStatus }) =>
      ticketStatus !== "resolved" && ticketStatus !== "closed",
  ).length
  const urgentCount = ticketFixtures.filter(
    ({ priority }) => priority === "urgent",
  ).length
  const waitingCount = ticketFixtures.filter(
    ({ status: ticketStatus }) => ticketStatus === "waiting_customer",
  ).length
  const completedCount = ticketFixtures.length - activeCount

  const resetFilters = () => {
    setSearch("")
    setStatus("all")
  }

  return (
    <section className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Service operations
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Ticket queue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Review and prioritize incoming customer requests.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Last refreshed just now · Static preview
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Active tickets"
          value={activeCount}
          helper="Across four customers"
          icon={TicketCheck}
        />
        <SummaryCard
          label="Urgent"
          value={urgentCount}
          helper="Requires immediate review"
          icon={AlertTriangle}
        />
        <SummaryCard
          label="Waiting"
          value={waitingCount}
          helper="Pending customer response"
          icon={Clock3}
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          helper="Resolved or closed"
          icon={CheckCircle2}
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search tickets"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ticket, company, or contact"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as StatusFilter)}
            >
              <SelectTrigger
                aria-label="Filter by status"
                className="w-full sm:w-44"
              >
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                {filterStatuses.map((filterStatus) => (
                  <SelectItem key={filterStatus} value={filterStatus}>
                    {filterStatus === "all"
                      ? "All statuses"
                      : getStatusLabel(filterStatus)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || status !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={resetFilters}
                aria-label="Clear ticket filters"
              >
                <FilterX />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            Showing {filteredTickets.length} of {ticketFixtures.length} tickets
          </span>
          <span>Sorted by most recently updated</span>
        </div>
        <TicketTable tickets={filteredTickets} />
      </div>
    </section>
  )
}

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
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query"

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
import { useApiClient } from "@/api/client"
import {
  fetchTicketPage,
  nextTicketOffset,
} from "@/features/tickets/ticket-api"
import {
  TicketTable,
  TicketTableSkeleton,
} from "@/features/tickets/ticket-table"
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
  const api = useApiClient()
  const cache = useQueryClient()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const ticketsQuery = useInfiniteQuery({
    queryKey: ["tickets"],
    queryFn: ({ pageParam, signal }) =>
      fetchTicketPage(api, cache, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: nextTicketOffset,
    retry: false,
  })

  const loadedTickets = useMemo(() => {
    const pages = ticketsQuery.data?.pages ?? []
    const updated = new Map(
      pages.flatMap((page) =>
        page.records.map(
          (record) => [record.id, Date.parse(record.updated_at)] as const,
        ),
      ),
    )
    return pages
      .flatMap((page) => page.summaries)
      .sort(
        (left, right) =>
          (updated.get(right.id) ?? 0) - (updated.get(left.id) ?? 0),
      )
  }, [ticketsQuery.data])

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return loadedTickets.filter((ticket) => {
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
  }, [loadedTickets, search, status])

  const activeCount = loadedTickets.filter(
    ({ status: ticketStatus }) =>
      ticketStatus !== "resolved" && ticketStatus !== "closed",
  ).length
  const urgentCount = loadedTickets.filter(
    ({ priority }) => priority === "urgent",
  ).length
  const waitingCount = loadedTickets.filter(
    ({ status: ticketStatus }) => ticketStatus === "waiting_customer",
  ).length
  const completedCount = loadedTickets.length - activeCount

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
          Live API data · Counts and search cover loaded tickets
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Active tickets"
          value={activeCount}
          helper="Among loaded tickets"
          icon={TicketCheck}
        />
        <SummaryCard
          label="Urgent"
          value={urgentCount}
          helper="Among loaded tickets"
          icon={AlertTriangle}
        />
        <SummaryCard
          label="Waiting"
          value={waitingCount}
          helper="Among loaded tickets"
          icon={Clock3}
        />
        <SummaryCard
          label="Completed"
          value={completedCount}
          helper="Among loaded tickets"
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

        {ticketsQuery.isPending ? (
          <TicketTableSkeleton />
        ) : ticketsQuery.isError && !ticketsQuery.data ? (
          <div
            role="alert"
            className="flex min-h-64 flex-col items-center justify-center gap-3 p-6 text-center"
          >
            <p className="text-sm font-medium">Unable to load tickets</p>
            <p className="text-xs text-muted-foreground">
              The API request did not complete. Your demo records have not been
              substituted.
            </p>
            <Button
              variant="outline"
              onClick={() => void ticketsQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : loadedTickets.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <h2 className="text-sm font-semibold">No tickets yet</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              The API returned an empty ticket queue.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
              <span>
                Showing {filteredTickets.length} of {loadedTickets.length}{" "}
                loaded tickets
              </span>
              <span>Newest update among loaded tickets first</span>
            </div>
            <TicketTable tickets={filteredTickets} />
            {ticketsQuery.hasNextPage && (
              <div className="flex flex-col items-center gap-2 border-t p-4">
                {ticketsQuery.isFetchNextPageError && (
                  <p role="alert" className="text-xs text-destructive">
                    Could not load more tickets. Try again.
                  </p>
                )}
                <Button
                  variant="outline"
                  disabled={ticketsQuery.isFetchingNextPage}
                  onClick={() => void ticketsQuery.fetchNextPage()}
                >
                  {ticketsQuery.isFetchingNextPage
                    ? "Loading…"
                    : "Load more tickets"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}

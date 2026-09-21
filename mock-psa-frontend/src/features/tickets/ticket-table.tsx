import { Inbox, UserRound } from "lucide-react"
import { Link } from "react-router"

import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/features/tickets/ticket-badges"
import type { TicketSummary } from "@/features/tickets/types"

export function TicketTable({
  tickets,
  ariaLabel = "Ticket queue",
}: {
  tickets: TicketSummary[]
  ariaLabel?: string
}) {
  if (tickets.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-2xl border bg-muted/30">
          <Inbox className="size-5 text-muted-foreground" />
        </div>
        <h2 className="mt-4 text-sm font-semibold">No tickets found</h2>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          Try another search term or change the status filter.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table aria-label={ariaLabel}>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-20">Ticket</TableHead>
            <TableHead className="sm:min-w-72">Summary</TableHead>
            <TableHead className="hidden min-w-44 2xl:table-cell">
              Company
            </TableHead>
            <TableHead className="hidden min-w-36 min-[1800px]:table-cell">
              Contact
            </TableHead>
            <TableHead className="hidden sm:table-cell">Priority</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden min-w-36 min-[1800px]:table-cell">
              Assignee
            </TableHead>
            <TableHead className="hidden min-w-28 text-right md:table-cell">
              Updated
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono text-xs font-semibold text-primary">
                #{ticket.id}
              </TableCell>
              <TableCell className="whitespace-normal">
                <Link
                  to={`/tickets/${ticket.id}`}
                  aria-label={`Open ticket #${ticket.id}: ${ticket.summary}`}
                  className="rounded-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {ticket.summary}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground min-[1800px]:hidden">
                  {ticket.company} · {ticket.contact}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 sm:hidden">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                  <span className="text-[11px] text-muted-foreground">
                    {ticket.updatedAt}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground 2xl:table-cell">
                {ticket.company}
              </TableCell>
              <TableCell className="hidden text-muted-foreground min-[1800px]:table-cell">
                {ticket.contact}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <TicketPriorityBadge priority={ticket.priority} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <TicketStatusBadge status={ticket.status} />
              </TableCell>
              <TableCell className="hidden min-[1800px]:table-cell">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <UserRound className="size-3.5" />
                  {ticket.assignee ?? "Unassigned"}
                </span>
              </TableCell>
              <TableCell className="hidden text-right text-xs text-muted-foreground md:table-cell">
                {ticket.updatedAt}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function TicketTableSkeleton() {
  return (
    <div aria-label="Loading ticket queue" className="space-y-1 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex h-12 items-center gap-4 px-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  )
}

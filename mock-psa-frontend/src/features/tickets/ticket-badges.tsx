import { Badge } from "@/components/ui/badge"
import type { TicketPriority, TicketStatus } from "@/features/tickets/types"
import { cn } from "@/lib/utils"

const statusLabels: Record<TicketStatus, string> = {
  new: "New",
  open: "Open",
  in_progress: "In progress",
  waiting_customer: "Waiting customer",
  resolved: "Resolved",
  closed: "Closed",
}

const statusStyles: Record<TicketStatus, string> = {
  new: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  open: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  in_progress:
    "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  waiting_customer:
    "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  resolved:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  closed: "border-border bg-muted text-muted-foreground",
}

const priorityLabels: Record<TicketPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
}

const priorityDotStyles: Record<TicketPriority, string> = {
  low: "bg-slate-400",
  normal: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-red-500",
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", statusStyles[status])}
    >
      {statusLabels[status]}
    </Badge>
  )
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority
}) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium">
      <span
        className={cn("size-1.5 rounded-full", priorityDotStyles[priority])}
      />
      {priorityLabels[priority]}
    </span>
  )
}

export function getStatusLabel(status: TicketStatus) {
  return statusLabels[status]
}

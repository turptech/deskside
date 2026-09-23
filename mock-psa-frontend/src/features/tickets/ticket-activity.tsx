import { Clock3, MessageSquare, NotebookPen } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  formatDuration,
  formatTicketTimestamp,
} from "@/features/tickets/ticket-format"
import type {
  TicketDetail,
  TicketNote,
  TicketTimeEntry,
} from "@/features/tickets/types"

type ActivityItem =
  | { kind: "note"; timestamp: string; record: TicketNote }
  | { kind: "time"; timestamp: string; record: TicketTimeEntry }

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-5 py-10 text-center">
        <NotebookPen className="size-5 text-muted-foreground" />
        <h3 className="mt-3 text-sm font-medium">No activity to show</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          There are no records for this view of the ticket.
        </p>
      </div>
    )
  }

  return (
    <ol aria-label="Ticket activity" className="divide-y">
      {items.map((item) => {
        const name =
          item.kind === "note"
            ? item.record.author.name
            : item.record.technician
        return (
          <li
            key={`${item.kind}-${item.record.id}`}
            className="flex gap-3 py-5 first:pt-2 last:pb-1"
          >
            <Avatar className="mt-0.5 size-8 shrink-0">
              <AvatarFallback className="bg-muted text-[10px] font-medium text-muted-foreground">
                {name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <p className="text-xs font-semibold">{name}</p>
                {item.kind === "note" ? (
                  <Badge
                    variant="outline"
                    className={
                      item.record.type === "internal"
                        ? "border-amber-500/20 bg-amber-500/10 font-normal text-amber-700 dark:text-amber-300"
                        : "font-normal"
                    }
                  >
                    <MessageSquare />
                    {item.record.type === "internal"
                      ? "Internal note"
                      : "Public note"}
                  </Badge>
                ) : (
                  <>
                    <Badge variant="secondary" className="font-normal">
                      <Clock3 />
                      Time entry
                    </Badge>
                    <Badge variant="outline" className="font-normal">
                      {item.record.billable ? "Billable" : "Non-billable"}
                    </Badge>
                  </>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <time dateTime={item.timestamp}>
                  {formatTicketTimestamp(item.timestamp)}
                </time>
                <span>
                  ·{" "}
                  {item.kind === "note"
                    ? `Note #${item.record.id} · ${item.record.author.kind === "contact" ? "Contact" : "Technician"}`
                    : `Started · Entry #${item.record.id}`}
                </span>
              </div>
              {item.kind === "time" && (
                <p className="mt-3 text-sm font-semibold">
                  {formatDuration(item.record.durationMinutes)}
                </p>
              )}
              <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm leading-6 text-foreground/85">
                {item.kind === "note"
                  ? item.record.body
                  : item.record.description}
              </p>
              {item.kind === "time" && item.record.ticketNoteId !== null && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Associated note #{item.record.ticketNoteId}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export function TicketActivity({ detail }: { detail: TicketDetail }) {
  const notes: ActivityItem[] = detail.notes.map((record) => ({
    kind: "note",
    timestamp: record.createdAt,
    record,
  }))
  const entries: ActivityItem[] = detail.timeEntries.map((record) => ({
    kind: "time",
    timestamp: record.startedAt,
    record,
  }))
  const byNewest = (left: ActivityItem, right: ActivityItem) =>
    Date.parse(right.timestamp) - Date.parse(left.timestamp)
  const totalMinutes = detail.timeEntries.reduce(
    (sum, entry) => sum + entry.durationMinutes,
    0,
  )
  const billableMinutes = detail.timeEntries.reduce(
    (sum, entry) => sum + (entry.billable ? entry.durationMinutes : 0),
    0,
  )
  const views = [
    {
      value: "all",
      label: "All",
      items: [...notes, ...entries].sort(byNewest),
    },
    { value: "notes", label: "Notes", items: notes.sort(byNewest) },
    { value: "time", label: "Time entries", items: entries.sort(byNewest) },
  ]

  return (
    <Card className="shadow-xs">
      <CardHeader className="gap-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>
            <h2 className="text-sm font-semibold">Activity</h2>
          </CardTitle>
          <dl className="flex gap-5 text-xs">
            <div>
              <dt className="text-muted-foreground">Logged time</dt>
              <dd className="mt-1 font-semibold">
                {formatDuration(totalMinutes)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Billable time</dt>
              <dd className="mt-1 font-semibold">
                {formatDuration(billableMinutes)}
              </dd>
            </div>
          </dl>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          key={detail.ticket.id}
          defaultValue="all"
          className="flex-col gap-5"
        >
          <TabsList
            aria-label="Filter ticket activity"
            className="h-9 max-w-full"
          >
            {views.map((view) => (
              <TabsTrigger
                key={view.value}
                value={view.value}
                className="px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                {view.label}
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {view.items.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {views.map((view) => (
            <TabsContent
              key={view.value}
              value={view.value}
              className="rounded-sm focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ActivityFeed items={view.items} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

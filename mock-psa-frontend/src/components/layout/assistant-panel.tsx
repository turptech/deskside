import { Bot, CircleDashed, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type AssistantPanelProps = {
  className?: string
  ticketSelected?: boolean
  inSheet?: boolean
}

export function AssistantPanel({
  className,
  ticketSelected = false,
  inSheet = false,
}: AssistantPanelProps) {
  return (
    <aside
      aria-label="DeskSide Assistant"
      className={cn(
        "flex h-full min-h-0 flex-col bg-card text-card-foreground",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center justify-between px-5",
          inSheet && "pr-12",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">DeskSide Assistant</h2>
            <p className="text-xs text-muted-foreground">Ticket intelligence</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-muted-foreground/60" />
          Not active
        </Badge>
      </div>
      <Separator />

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-7 py-10">
        <div className="app-grid-pattern pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
            <Bot className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-5 text-sm font-semibold">
            {ticketSelected
              ? "No agent session connected"
              : "Ready for a ticket"}
          </h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {ticketSelected
              ? "This ticket is a read-only synthetic workspace. Live assistance will appear here when an agent session is connected."
              : "Live assistance will appear here after a ticket workspace and agent session are connected."}
          </p>
        </div>
      </div>

      <Separator />
      <div className="flex h-12 shrink-0 items-center gap-2 px-5 text-xs text-muted-foreground">
        <CircleDashed className="size-3.5" />
        Agent service disconnected
      </div>
    </aside>
  )
}

import { Sparkles } from "lucide-react"

import { AssistantPanel } from "@/components/layout/assistant-panel"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function AssistantSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="xl:hidden"
          aria-label="Open DeskSide Assistant"
        >
          <Sparkles />
          <span className="hidden sm:inline">Assistant</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[22rem]">
        <SheetHeader className="sr-only">
          <SheetTitle>DeskSide Assistant</SheetTitle>
          <SheetDescription>
            Ticket intelligence and agent activity panel
          </SheetDescription>
        </SheetHeader>
        <AssistantPanel />
      </SheetContent>
    </Sheet>
  )
}

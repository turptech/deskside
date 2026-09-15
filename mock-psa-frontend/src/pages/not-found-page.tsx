import { ArrowLeft, MapPinOff } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"

export function NotFoundPage() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-muted/20 px-6">
      <div className="app-grid-pattern pointer-events-none absolute inset-0 opacity-70" />
      <section className="relative max-w-md text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-2xl border bg-background shadow-sm">
          <MapPinOff className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Workspace not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This area of the service desk has not been added yet.
        </p>
        <Button asChild className="mt-6">
          <Link to="/tickets">
            <ArrowLeft />
            Return to tickets
          </Link>
        </Button>
      </section>
    </main>
  )
}

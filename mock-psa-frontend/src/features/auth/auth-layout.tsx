import { Headphones } from "lucide-react"
import type { ReactNode } from "react"

import { ThemeToggle } from "@/app/theme-toggle"

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-muted/20 px-4 py-10 sm:px-6">
      <div className="app-grid-pattern pointer-events-none absolute inset-0 opacity-70" />
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
      <section className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Headphones className="size-5" />
          </div>
          <div>
            <p className="font-semibold tracking-tight">DeskSide</p>
            <p className="text-xs text-muted-foreground">
              Service desk workspace
            </p>
          </div>
        </div>
        {children}
      </section>
    </main>
  )
}

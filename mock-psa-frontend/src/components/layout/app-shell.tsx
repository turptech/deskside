import { Database, PanelLeft } from "lucide-react"
import { useEffect, useRef } from "react"
import { Outlet, useLocation, useMatch } from "react-router"

import { ThemeToggle } from "@/app/theme-toggle"
import { AssistantPanel } from "@/components/layout/assistant-panel"
import { AssistantSheet } from "@/components/layout/assistant-sheet"
import { NavigationSidebar } from "@/components/layout/navigation-sidebar"
import { Badge } from "@/components/ui/badge"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { useMediaQuery } from "@/hooks/use-media-query"

export function AppShell() {
  const showExpandedNavigation = useMediaQuery("(min-width: 1280px)")
  const { pathname } = useLocation()
  const ticketSelected = Boolean(useMatch("/tickets/:ticketId"))
  const companySelected = Boolean(useMatch("/companies/:companyId"))
  const siteSelected = Boolean(useMatch("/sites/:siteId"))
  const companyDirectory = Boolean(useMatch("/companies"))
  const contactSelected = Boolean(useMatch("/contacts/:contactId"))
  const contactDirectory = Boolean(useMatch("/contacts"))
  const assetSelected = Boolean(useMatch("/assets/:assetId"))
  const assetDirectory = Boolean(useMatch("/assets"))
  const articleSelected = Boolean(useMatch("/knowledge-articles/:articleId"))
  const articleDirectory = Boolean(useMatch("/knowledge-articles"))
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [pathname])

  return (
    <SidebarProvider
      open={showExpandedNavigation}
      className="h-dvh min-h-0 overflow-hidden"
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "4rem",
        } as React.CSSProperties
      }
    >
      <NavigationSidebar />

      <div className="flex min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col bg-muted/20">
          <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger
                className="md:hidden"
                aria-label="Open navigation"
              >
                <PanelLeft />
              </SidebarTrigger>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  Operations
                </p>
                <p className="truncate text-sm font-medium">
                  {ticketSelected
                    ? "Ticket details"
                    : companySelected
                      ? "Company details"
                      : siteSelected
                        ? "Site details"
                        : contactSelected
                          ? "Contact details"
                          : assetSelected
                            ? "Asset details"
                            : articleSelected
                              ? "Knowledge article"
                              : articleDirectory
                                ? "Knowledge library"
                                : assetDirectory
                                  ? "Asset directory"
                                  : contactDirectory
                                    ? "Contact directory"
                                    : companyDirectory
                                      ? "Company directory"
                                      : "Ticket queue"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="hidden gap-1.5 font-normal sm:flex"
              >
                <Database className="size-3" />
                Synthetic demo data
              </Badge>
              <ThemeToggle />
              <AssistantSheet ticketSelected={ticketSelected} />
            </div>
          </header>

          <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>

        <AssistantPanel
          ticketSelected={ticketSelected}
          className="hidden w-[22rem] shrink-0 border-l xl:flex"
        />
      </div>
    </SidebarProvider>
  )
}

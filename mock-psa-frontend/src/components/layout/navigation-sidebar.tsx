import {
  BookOpenText,
  Building2,
  ContactRound,
  HardDrive,
  Headphones,
  Ticket,
} from "lucide-react"
import { NavLink, useLocation } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { companyFixtures } from "@/features/companies/fixtures"
import { ticketFixtures } from "@/features/tickets/fixtures"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

const futureDestinations = [
  { label: "Contacts", icon: ContactRound },
  { label: "Assets", icon: HardDrive },
  { label: "Knowledge", icon: BookOpenText },
]

export function NavigationSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const ticketsActive =
    pathname === "/tickets" || pathname.startsWith("/tickets/")
  const companiesActive =
    pathname === "/companies" ||
    pathname.startsWith("/companies/") ||
    pathname.startsWith("/sites/")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <div className="flex items-center gap-2.5 overflow-hidden px-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
            <Headphones className="size-4" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold tracking-tight">
              DeskSide
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Service desk workspace
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="Primary navigation">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={ticketsActive}
                    tooltip="Tickets"
                  >
                    <NavLink to="/tickets" onClick={() => setOpenMobile(false)}>
                      <Ticket />
                      <span>Tickets</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{ticketFixtures.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={companiesActive}
                    tooltip="Companies"
                  >
                    <NavLink
                      to="/companies"
                      onClick={() => setOpenMobile(false)}
                    >
                      <Building2 />
                      <span>Companies</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{companyFixtures.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                {futureDestinations.map(({ label, icon: Icon }) => (
                  <SidebarMenuItem key={label}>
                    <SidebarMenuButton
                      disabled
                      tooltip={`${label} — coming soon`}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                    <SidebarMenuBadge className="text-[10px] text-muted-foreground">
                      Soon
                    </SidebarMenuBadge>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <Avatar className="size-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              AT
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-medium">Alex Technician</p>
            <p className="truncate text-[11px] text-muted-foreground">
              Demo workspace
            </p>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

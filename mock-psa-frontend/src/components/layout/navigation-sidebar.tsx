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
import { assetFixtures } from "@/features/assets/fixtures"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures } from "@/features/contacts/fixtures"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"
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

export function NavigationSidebar() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()
  const ticketsActive =
    pathname === "/tickets" || pathname.startsWith("/tickets/")
  const companiesActive =
    pathname === "/companies" ||
    pathname.startsWith("/companies/") ||
    pathname.startsWith("/sites/")
  const contactsActive =
    pathname === "/contacts" || pathname.startsWith("/contacts/")
  const assetsActive = pathname === "/assets" || pathname.startsWith("/assets/")
  const knowledgeActive =
    pathname === "/knowledge-articles" ||
    pathname.startsWith("/knowledge-articles/")

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
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={contactsActive}
                    tooltip="Contacts"
                  >
                    <NavLink
                      to="/contacts"
                      onClick={() => setOpenMobile(false)}
                    >
                      <ContactRound />
                      <span>Contacts</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{contactFixtures.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={assetsActive}
                    tooltip="Assets"
                  >
                    <NavLink to="/assets" onClick={() => setOpenMobile(false)}>
                      <HardDrive />
                      <span>Assets</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{assetFixtures.length}</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={knowledgeActive}
                    tooltip="Knowledge"
                  >
                    <NavLink
                      to="/knowledge-articles"
                      onClick={() => setOpenMobile(false)}
                    >
                      <BookOpenText />
                      <span>Knowledge</span>
                    </NavLink>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>
                    {knowledgeArticleFixtures.length}
                  </SidebarMenuBadge>
                </SidebarMenuItem>
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

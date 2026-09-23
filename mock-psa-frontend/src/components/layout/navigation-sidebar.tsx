import {
  BookOpenText,
  Building2,
  ContactRound,
  ChevronsUpDown,
  HardDrive,
  Headphones,
  LogOut,
  Ticket,
} from "lucide-react"
import { NavLink, useLocation, useNavigate } from "react-router"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { assetFixtures } from "@/features/assets/fixtures"
import { companyFixtures } from "@/features/companies/fixtures"
import { contactFixtures } from "@/features/contacts/fixtures"
import { knowledgeArticleFixtures } from "@/features/knowledge-articles/fixtures"
import { useAuth } from "@/features/auth/auth-context"
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
  const { isMobile, setOpenMobile } = useSidebar()
  const navigate = useNavigate()
  const { user } = useAuth()
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
  const roleLabel = user?.role
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
  const emailName = user?.email.split("@")[0] ?? "user"
  const emailParts = emailName.split(/[._-]+/).filter(Boolean)
  const initials = (
    emailParts.length > 1
      ? `${emailParts[0]?.[0] ?? ""}${emailParts[1]?.[0] ?? ""}`
      : emailName.slice(0, 2)
  ).toUpperCase()

  const handleLogout = () => {
    setOpenMobile(false)
    navigate("/logout", { replace: true })
  }

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

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  aria-label={`Open account menu for ${user?.email ?? "current user"}`}
                >
                  <Avatar className="size-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 text-left group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-xs font-medium">
                      {user?.email}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {roleLabel}
                    </p>
                  </div>
                  <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isMobile ? "top" : "right"}
                align={isMobile ? "start" : "end"}
                sideOffset={8}
                className="min-w-56"
              >
                <DropdownMenuLabel className="font-normal">
                  <p className="truncate text-sm font-medium">{user?.email}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {roleLabel}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

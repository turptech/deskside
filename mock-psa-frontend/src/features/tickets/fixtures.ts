import { contactFixtures, getContactName } from "@/features/contacts/fixtures"
import type { TicketSummary } from "@/features/tickets/types"

/** Synthetic records used only to establish the frontend UX. */
const ticketContent: Omit<TicketSummary, "contact">[] = [
  {
    id: 1048,
    summary: "VPN disconnecting across Raleigh office",
    companyId: 1,
    company: "Northstar Architecture",
    contactId: 1,
    priority: "urgent",
    status: "in_progress",
    assignee: "Alex Technician",
    source: "phone",
    updatedAt: "2 min ago",
  },
  {
    id: 1047,
    summary: "Outlook sign-in loops after MFA prompt",
    companyId: 2,
    company: "Juniper Dental Group",
    contactId: 2,
    priority: "high",
    status: "open",
    assignee: "Sam Rivera",
    source: "email",
    updatedAt: "11 min ago",
  },
  {
    id: 1046,
    summary: "Warehouse label printer reports offline",
    companyId: 3,
    company: "Crescent Supply Co.",
    contactId: 3,
    priority: "normal",
    status: "waiting_customer",
    assignee: "Alex Technician",
    source: "portal",
    updatedAt: "28 min ago",
  },
  {
    id: 1045,
    summary: "Provision laptop for new finance hire",
    companyId: 4,
    company: "Beacon Financial Partners",
    contactId: 4,
    priority: "low",
    status: "new",
    assignee: null,
    source: "portal",
    updatedAt: "43 min ago",
  },
  {
    id: 1044,
    summary: "Nightly backup missed on APP-SRV-02",
    companyId: 5,
    company: "Hawthorne Legal",
    contactId: 5,
    priority: "high",
    status: "resolved",
    assignee: "Taylor Brooks",
    source: "monitoring",
    updatedAt: "1 hr ago",
  },
  {
    id: 1043,
    summary: "Microsoft 365 mail delivery delayed",
    companyId: 1,
    company: "Northstar Architecture",
    contactId: 6,
    priority: "high",
    status: "open",
    assignee: "Sam Rivera",
    source: "phone",
    updatedAt: "2 hrs ago",
  },
  {
    id: 1042,
    summary: "Enroll replacement phone in device management",
    companyId: 3,
    company: "Crescent Supply Co.",
    contactId: 7,
    priority: "low",
    status: "closed",
    assignee: "Taylor Brooks",
    source: "email",
    updatedAt: "Yesterday",
  },
  {
    id: 1041,
    summary: "Intermittent DNS failures at branch office",
    companyId: 2,
    company: "Juniper Dental Group",
    contactId: 2,
    priority: "urgent",
    status: "resolved",
    assignee: "Alex Technician",
    source: "monitoring",
    updatedAt: "Yesterday",
  },
]

export const ticketFixtures: TicketSummary[] = ticketContent.map((ticket) => {
  const contact = contactFixtures.find(({ id }) => id === ticket.contactId)
  if (!contact || contact.companyId !== ticket.companyId)
    throw new Error(`Invalid synthetic contact for ticket ${ticket.id}`)
  return { ...ticket, contact: getContactName(contact) }
})

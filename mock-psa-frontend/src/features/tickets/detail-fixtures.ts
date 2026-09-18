import { ticketFixtures } from "@/features/tickets/fixtures"
import type { TicketDetail } from "@/features/tickets/types"

/** Entirely synthetic records. Queue identity and labels have one shared source. */
const detailContent: Record<number, Omit<TicketDetail, "ticket">> = {
  1048: {
    description:
      "Several team members at the Raleigh office report that the VPN disconnects every 10–15 minutes. Reconnecting restores access briefly, but active file transfers are interrupted.\n\nThe issue began this morning and affects remote access to project files. Morgan can coordinate testing with the design team. Please investigate the office gateway and VPN session logs.",
    contact: { email: "morgan.lee@northstar.example", phone: "(919) 555-0148" },
    site: {
      name: "Raleigh office",
      address: "120 Example Avenue, Raleigh, NC",
    },
    asset: { name: "Office VPN gateway", hostname: "NS-RAL-FW-01" },
    createdAt: "2026-09-15T12:45:00Z",
    updatedAt: "2026-09-15T14:28:00Z",
    resolvedAt: null,
    notes: [
      {
        id: 501,
        type: "public",
        author: { name: "Morgan Lee", kind: "contact" },
        body: "Three designers have reported the same disconnect this morning. We can reproduce it during large file transfers; web browsing is unaffected.",
        createdAt: "2026-09-15T12:55:00Z",
      },
      {
        id: 502,
        type: "internal",
        author: { name: "Alex Technician", kind: "technician" },
        body: "Reviewed gateway logs and found repeated tunnel renegotiation events. Comparing the current session timeout configuration with the last known-good configuration.\n\nNo configuration changes have been applied yet.",
        createdAt: "2026-09-15T13:35:00Z",
      },
      {
        id: 503,
        type: "public",
        author: { name: "Alex Technician", kind: "technician" },
        body: "We have isolated the issue to VPN session handling and are continuing the investigation. Please keep one affected workstation available for a supervised test.",
        createdAt: "2026-09-15T14:28:00Z",
      },
    ],
    timeEntries: [
      {
        id: 701,
        technician: "Alex Technician",
        ticketNoteId: 502,
        startedAt: "2026-09-15T13:05:00Z",
        durationMinutes: 30,
        description: "Reviewed VPN logs and compared gateway session settings.",
        billable: true,
      },
      {
        id: 702,
        technician: "Alex Technician",
        ticketNoteId: null,
        startedAt: "2026-09-15T14:00:00Z",
        durationMinutes: 15,
        description:
          "Coordinated a test window and prepared a customer update.",
        billable: false,
      },
    ],
  },
  1047: {
    description:
      "Outlook repeatedly asks Priya to sign in after completing the MFA prompt. Browser access to mail works normally. Please investigate the desktop sign-in session.",
    contact: { email: "priya.shah@juniper.example", phone: "(919) 555-0147" },
    site: { name: "Main practice", address: null },
    asset: { name: "Reception workstation", hostname: "JD-RECEPTION-01" },
    createdAt: "2026-09-15T12:30:00Z",
    updatedAt: "2026-09-15T14:19:00Z",
    resolvedAt: null,
    notes: [
      {
        id: 504,
        type: "internal",
        author: { name: "Sam Rivera", kind: "technician" },
        body: "Confirmed browser access is working. Requested a screenshot of the desktop sign-in prompt before troubleshooting the cached session.",
        createdAt: "2026-09-15T14:19:00Z",
      },
    ],
    timeEntries: [],
  },
  1046: {
    description:
      "The shipping team's label printer is showing offline. Jobs remain in the print queue. Waiting for the customer to confirm the printer's network indicator and power status.",
    contact: {
      email: "derek.wilson@crescent.example",
      phone: "(919) 555-0146",
    },
    site: {
      name: "Distribution warehouse",
      address: "40 Demo Lane, Raleigh, NC",
    },
    asset: { name: "Shipping label printer", hostname: "CS-LABEL-02" },
    createdAt: "2026-09-15T11:00:00Z",
    updatedAt: "2026-09-15T14:02:00Z",
    resolvedAt: null,
    notes: [
      {
        id: 505,
        type: "public",
        author: { name: "Alex Technician", kind: "technician" },
        body: "Please confirm the printer is powered on and send a photo of the network indicator. We will continue troubleshooting once those details are available.",
        createdAt: "2026-09-15T14:02:00Z",
      },
    ],
    timeEntries: [
      {
        id: 703,
        technician: "Alex Technician",
        ticketNoteId: 505,
        startedAt: "2026-09-15T13:45:00Z",
        durationMinutes: 15,
        description:
          "Checked the print queue and requested physical connectivity checks.",
        billable: true,
      },
    ],
  },
  1045: {
    description: null,
    contact: { email: "elena.torres@beacon.example", phone: null },
    site: null,
    asset: null,
    createdAt: "2026-09-15T13:47:00Z",
    updatedAt: "2026-09-15T13:47:00Z",
    resolvedAt: null,
    notes: [],
    timeEntries: [],
  },
  1044: {
    description:
      "Monitoring detected a missed nightly backup on APP-SRV-02. Investigate the failed job and verify that a replacement backup completes successfully.",
    contact: {
      email: "chris.nguyen@hawthorne.example",
      phone: "(919) 555-0144",
    },
    site: { name: "Head office", address: null },
    asset: { name: "Application server", hostname: "APP-SRV-02" },
    createdAt: "2026-09-15T08:00:00Z",
    updatedAt: "2026-09-15T13:30:00Z",
    resolvedAt: "2026-09-15T13:30:00Z",
    notes: [
      {
        id: 506,
        type: "public",
        author: { name: "Taylor Brooks", kind: "technician" },
        body: "The replacement backup completed successfully after clearing the stalled job. Verified the recovery point and restored the normal schedule.",
        createdAt: "2026-09-15T13:30:00Z",
      },
    ],
    timeEntries: [
      {
        id: 704,
        technician: "Taylor Brooks",
        ticketNoteId: 506,
        startedAt: "2026-09-15T12:15:00Z",
        durationMinutes: 60,
        description:
          "Recovered the backup job and verified the replacement recovery point.",
        billable: true,
      },
    ],
  },
  1043: {
    description:
      "Outgoing Microsoft 365 messages are arriving later than expected. Collect sample message IDs and review delivery traces to identify the source of the delay.",
    contact: {
      email: "jamie.patel@northstar.example",
      phone: "(919) 555-0143",
    },
    site: null,
    asset: null,
    createdAt: "2026-09-15T10:45:00Z",
    updatedAt: "2026-09-15T12:30:00Z",
    resolvedAt: null,
    notes: [],
    timeEntries: [
      {
        id: 705,
        technician: "Sam Rivera",
        ticketNoteId: null,
        startedAt: "2026-09-15T12:00:00Z",
        durationMinutes: 30,
        description:
          "Collected sample message IDs and reviewed initial delivery traces.",
        billable: true,
      },
    ],
  },
  1042: {
    description:
      "Enroll Robin's replacement phone in device management and verify access to company email. The previous device has already been retired.",
    contact: { email: "robin.carter@crescent.example", phone: null },
    site: null,
    asset: { name: "Replacement mobile phone", hostname: null },
    createdAt: "2026-09-14T13:00:00Z",
    updatedAt: "2026-09-14T16:00:00Z",
    resolvedAt: "2026-09-14T15:00:00Z",
    notes: [
      {
        id: 507,
        type: "public",
        author: { name: "Taylor Brooks", kind: "technician" },
        body: "Enrollment and email access verified with Robin. The replacement device is ready to use.",
        createdAt: "2026-09-14T15:00:00Z",
      },
    ],
    timeEntries: [
      {
        id: 706,
        technician: "Taylor Brooks",
        ticketNoteId: 507,
        startedAt: "2026-09-14T14:15:00Z",
        durationMinutes: 45,
        description:
          "Enrolled the replacement device and verified compliance and email access.",
        billable: true,
      },
    ],
  },
  1041: {
    description:
      "The branch office reported intermittent name-resolution failures. Review resolver health and confirm that workstations can consistently resolve internal and external services.",
    contact: { email: "priya.shah@juniper.example", phone: "(919) 555-0147" },
    site: { name: "Branch practice", address: null },
    asset: { name: "Branch resolver", hostname: "JD-BR-DNS-01" },
    createdAt: "2026-09-14T09:00:00Z",
    updatedAt: "2026-09-14T17:00:00Z",
    resolvedAt: "2026-09-14T17:00:00Z",
    notes: [
      {
        id: 508,
        type: "internal",
        author: { name: "Alex Technician", kind: "technician" },
        body: "Removed an unreachable upstream resolver and verified repeated lookups from two branch workstations. No further failures observed during the test window.",
        createdAt: "2026-09-14T17:00:00Z",
      },
    ],
    timeEntries: [
      {
        id: 707,
        technician: "Alex Technician",
        ticketNoteId: 508,
        startedAt: "2026-09-14T15:30:00Z",
        durationMinutes: 90,
        description:
          "Investigated upstream resolution and verified the updated resolver configuration.",
        billable: true,
      },
    ],
  },
}

export const ticketDetailFixtures: TicketDetail[] = ticketFixtures.map(
  (ticket) => {
    const content = detailContent[ticket.id]
    if (!content)
      throw new Error(`Missing synthetic detail for ticket ${ticket.id}`)
    return { ticket, ...content }
  },
)

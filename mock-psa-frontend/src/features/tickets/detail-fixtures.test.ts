import { ticketDetailFixtures } from "@/features/tickets/detail-fixtures"
import { ticketFixtures } from "@/features/tickets/fixtures"
import { formatDuration } from "@/features/tickets/ticket-format"

describe("synthetic ticket details", () => {
  it("keeps the established queue labels and contact-originated detail", () => {
    expect(ticketFixtures.map(({ id, updatedAt }) => [id, updatedAt])).toEqual([
      [1048, "2 min ago"],
      [1047, "11 min ago"],
      [1046, "28 min ago"],
      [1045, "43 min ago"],
      [1044, "1 hr ago"],
      [1043, "2 hrs ago"],
      [1042, "Yesterday"],
      [1041, "Yesterday"],
    ])
    expect(
      ticketDetailFixtures
        .flatMap(({ notes }) => notes)
        .find(({ id }) => id === 501)?.author,
    ).toEqual({ name: "Morgan Lee", kind: "contact" })
  })

  it("has exactly one detail for every queue record with shared identity", () => {
    expect(ticketDetailFixtures).toHaveLength(ticketFixtures.length)
    expect(
      new Set(ticketDetailFixtures.map(({ ticket }) => ticket.id)).size,
    ).toBe(ticketFixtures.length)
    for (const ticket of ticketFixtures) {
      expect(
        ticketDetailFixtures.find((detail) => detail.ticket.id === ticket.id)
          ?.ticket,
      ).toBe(ticket)
    }
  })

  it("uses reserved addresses, valid timestamps, and valid associated notes", () => {
    for (const detail of ticketDetailFixtures) {
      expect(detail.contact.email).toMatch(/\.example$/)
      expect(Date.parse(detail.createdAt)).not.toBeNaN()
      expect(Date.parse(detail.updatedAt)).not.toBeNaN()
      expect(Date.parse(detail.updatedAt)).toBeGreaterThanOrEqual(
        Date.parse(detail.createdAt),
      )
      if (detail.resolvedAt) expect(Date.parse(detail.resolvedAt)).not.toBeNaN()
      for (const note of detail.notes)
        expect(Date.parse(note.createdAt)).not.toBeNaN()
      for (const entry of detail.timeEntries) {
        expect(Date.parse(entry.startedAt)).not.toBeNaN()
        expect(entry.durationMinutes).toBeGreaterThan(0)
        if (entry.ticketNoteId !== null) {
          expect(
            detail.notes.some((note) => note.id === entry.ticketNoteId),
          ).toBe(true)
        }
      }
    }
  })

  it.each([
    [0, "0 min"],
    [45, "45 min"],
    [60, "1 hr"],
    [90, "1 hr 30 min"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes as number)).toBe(expected)
  })
})

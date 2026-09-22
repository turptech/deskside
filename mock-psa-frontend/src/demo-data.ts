import demoData from "../../demo-fixtures/psa.json"

export { demoData }

export function technicianName(id: number | null): string | null {
  if (id === null) return null
  const technician = demoData.technicians.find((user) => user.id === id)
  if (!technician) throw new Error(`Unknown demo technician ${id}`)
  return technician.display_name
}

export function queueAge(updatedAt: string): string {
  const demoNow = new Date(demoData.demo_now)
  const updated = new Date(updatedAt)
  if (
    Number.isNaN(demoNow.getTime()) ||
    Number.isNaN(updated.getTime()) ||
    updated.getTime() > demoNow.getTime()
  ) {
    throw new Error(`Invalid demo ticket timestamp ${updatedAt}`)
  }
  if (updated.toISOString().slice(0, 10) !== demoNow.toISOString().slice(0, 10))
    return "Yesterday"
  const minutes = Math.floor((demoNow.getTime() - updated.getTime()) / 60_000)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`
}

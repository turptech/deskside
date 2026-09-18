const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function formatTicketTimestamp(value: string) {
  return `${timestampFormatter.format(new Date(value))} UTC`
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours === 0) return `${remainder} min`
  return remainder === 0 ? `${hours} hr` : `${hours} hr ${remainder} min`
}

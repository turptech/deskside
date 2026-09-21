const timestampFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
})

export function formatArticleTimestamp(value: string): string {
  return `${timestampFormatter.format(new Date(value))} UTC`
}

export function getArticleExcerpt(body: string): string {
  const singleLine = body.replace(/\s+/g, " ").trim()
  return singleLine.length > 140
    ? `${singleLine.slice(0, 137).trimEnd()}…`
    : singleLine
}

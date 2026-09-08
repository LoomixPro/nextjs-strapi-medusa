/** Escape a value for Meilisearch filter string literals (single-quoted). */
export function escapeMeilisearchFilterValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export function meilisearchFilterEquals(field: string, value: string): string {
  return `${field} = '${escapeMeilisearchFilterValue(value)}'`
}

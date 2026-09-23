/**
 * Logs auth errors to the Next.js server console for developer debugging.
 * The real error is NEVER sent to the browser.
 */
export function authLog(context: string, error: unknown): void {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`[AUTH ERROR] ${context}: ${msg}`)
  if (error instanceof Error && error.stack) {
    console.error(error.stack)
  }
}

/**
 * Validates a redirect URL to prevent open-redirect attacks.
 * Only relative paths starting with "/" (not "//") are allowed.
 */
export function safeRedirectUrl(
  url: string | null | undefined,
  fallback = "/"
): string {
  if (!url || typeof url !== "string") return fallback
  const trimmed = url.trim()
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed
  }
  return fallback
}

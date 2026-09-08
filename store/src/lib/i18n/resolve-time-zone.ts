/**
 * Validates whether a given string is a valid IANA Timezone identifier.
 */
export function isValidTimeZone(tz?: string | null): boolean {
  if (!tz) return false
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/**
 * Resolves the effective IANA Timezone for the storefront.
 * Priority:
 * 1. Explicit timezone configured in Strapi settings
 * 2. Environment variable (NEXT_PUBLIC_DEFAULT_TIMEZONE or DEFAULT_TIMEZONE)
 * 3. Universal standard fallback: "UTC"
 *
 * @param explicitTimeZone - Optional timezone passed from Strapi settings
 */
export function resolveTimeZone(explicitTimeZone?: string | null): string {
  // 1. Check explicit timezone (e.g. from Strapi Storefront Settings)
  if (explicitTimeZone && isValidTimeZone(explicitTimeZone)) {
    return explicitTimeZone
  }

  // 2. Check environment variable
  const fromEnv =
    process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || process.env.DEFAULT_TIMEZONE

  if (fromEnv && isValidTimeZone(fromEnv)) {
    return fromEnv
  }

  // 3. Universal fallback
  return "UTC"
}

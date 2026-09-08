export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE || "en-US"

export type SupportedLocale = "fa-IR" | "en-US" | "ar-AE"

/**
 * Normalizes any locale string to the project's standard 4-letter format (fa-IR, en-US, ar-AE).
 */
export function resolveLocale(locale?: string | null): SupportedLocale {
  if (!locale) {
    const defaultClean = DEFAULT_LOCALE.toLowerCase()
    if (defaultClean.startsWith("fa")) return "fa-IR"
    if (defaultClean.startsWith("ar")) return "ar-AE"
    return "en-US"
  }

  const clean = locale.toLowerCase()
  if (clean.startsWith("fa")) return "fa-IR"
  if (clean.startsWith("ar")) return "ar-AE"
  if (clean.startsWith("en")) return "en-US"

  return resolveLocale(DEFAULT_LOCALE)
}

/**
 * Resolves the appropriate 4-letter locale for an order based on order metadata or DEFAULT_LOCALE.
 */
export function resolveOrderLocale(order?: { metadata?: Record<string, any> | null } | null): SupportedLocale {
  return resolveLocale(order?.metadata?.locale as string | undefined)
}

/**
 * Determines if a locale or country code string represents a Right-to-Left (RTL) language.
 * Covers Arabic (ar, ar-AE, etc.), Persian/Farsi (fa, fa-IR, etc.), Hebrew (he), Urdu (ur), etc.
 * If locale is "default" or empty, direction is resolved from Strapi storefront settings (settings.isRtl).
 */
export function isRtlLocale(
  locale?: string | null,
  settings?: { isRtl?: boolean | null } | null
): boolean {
  if (!locale || locale === "default") {
    return Boolean(settings?.isRtl)
  }
  const lower = locale.toLowerCase().trim()
  return (
    lower.startsWith("fa") ||
    lower.startsWith("ar") ||
    lower.startsWith("he") ||
    lower.startsWith("ur") ||
    lower === "ir" ||
    lower === "ae"
  )
}

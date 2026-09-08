import { isIranFeaturesEnabled } from "./storefront-settings"

/**
 * Converts a date string or Date object to Jalali (Shamsi) format.
 * Uses the built-in Intl.DateTimeFormat API — no external library needed.
 * Fallback to standard Gregorian formatting if Iran features are disabled.
 *
 * @param date - ISO date string or Date object
 * @param options - Optional Intl.DateTimeFormat options (default: day/month/year numeric)
 * @returns Formatted Jalali or Gregorian date string
 */
export function toJalali(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...options,
  }

  const locale = isIranFeaturesEnabled ? "fa-IR" : "en-US"
  return new Intl.DateTimeFormat(locale, defaultOptions).format(d)
}

/**
 * Converts a date string or Date object to Jalali with full date-time.
 * Fallback to standard Gregorian formatting if Iran features are disabled.
 */
export function toJalaliDateTime(
  date: string | Date | null | undefined
): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return ""

  const locale = isIranFeaturesEnabled ? "fa-IR" : "en-US"
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

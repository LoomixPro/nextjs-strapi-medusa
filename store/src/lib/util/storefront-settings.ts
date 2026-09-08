import { cache } from "react"
import { isEmpty } from "./isEmpty"

// Global feature toggle for Iran-specific features
export const isIranFeaturesEnabled =
  process.env.NEXT_PUBLIC_ENABLE_IRAN_FEATURES === "true"

// Client-side global settings variable
let globalActiveSettings: any = null

/**
 * Sets the global settings object for client-side use.
 * @param settings - The application settings to store globally
 */
export function setClientSettings(settings: any) {
  globalActiveSettings = settings
}

/**
 * Retrieves the currently active global settings.
 * @returns The global settings object or null if not set
 */
export function getActiveSettings() {
  return globalActiveSettings
}

/**
 * Determines whether currency conversion from Rial to Toman is enabled.
 * Checks server-side context or client-side global settings depending on the environment.
 * @returns True if Toman conversion is enabled, false otherwise
 */
export function isTomanEnabled(): boolean {
  if (!isIranFeaturesEnabled) return false
  if (typeof window === "undefined") {
    return Boolean(getRequestStore().settings?.convertToToman)
  }
  return Boolean(globalActiveSettings?.convertToToman)
}

/**
 * Retrieves the currently active button settings.
 * Resolves settings either from request store (server) or global variable (client).
 */
export function getButtonSettings() {
  let activeSettings = null
  if (typeof window === "undefined") {
    const store = getRequestStore()
    activeSettings = store.settings || globalActiveSettings
  } else {
    activeSettings = globalActiveSettings
  }
  return activeSettings?.button || { style: "style-1" }
}

// Server-side request-scoped store
const getRequestStore = cache(() => ({
  locale: "default",
  settings: null as any,
}))

/**
 * Hydrates the server-side cache store with the current locale and settings
 * for a specific incoming request.
 * @param locale - The locale string for the current request
 * @param settings - The applicable settings for the current request
 */
export function setServerRequestStore(locale: string, settings: any) {
  const store = getRequestStore()
  store.locale = locale
  store.settings = settings
}

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
  /** Pass settings explicitly to avoid server/client mismatch */
  settings?: { convertToToman?: boolean } | null
}

/**
 * Resolves the effective locale from the given locale string.
 * This is a pure function with no server/client branching.
 */
function resolveLocale(locale?: string | null): string {
  if (!locale || locale === "default") {
    return (
      process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
      process.env.DEFAULT_LOCALE ||
      "en-US"
    )
  }
  return locale
}

/**
 * Main utility function for formatting monetary amounts based on currency and locale.
 * It handles the special case of converting Iranian Rial (IRR) to Toman when configured.
 * It resolves settings either explicitly passed, or via client/server context.
 *
 * @param params - The configuration for currency formatting including amount, currency code, etc.
 * @returns A formatted string representing the monetary amount
 */
export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale,
  settings,
}: ConvertToLocaleParams) => {
  // If no settings passed explicitly, try to resolve from context.
  // On the server this uses the request store, on client the global variable.
  // When callers pass settings explicitly (recommended), this branch is skipped
  // and the function becomes fully deterministic.
  let activeSettings = settings ?? null
  let activeLocale = locale
  if (typeof window === "undefined") {
    const store = getRequestStore()
    activeSettings = activeSettings ?? (store.settings || globalActiveSettings)
    activeLocale = activeLocale ?? store.locale
  } else {
    activeSettings = activeSettings ?? globalActiveSettings
    activeLocale = activeLocale ?? (document.documentElement.lang || "en-US")
  }

  const targetLocale = resolveLocale(activeLocale || "en-US")
  const isFa = targetLocale.startsWith("fa")
  const convertToToman = activeSettings?.convertToToman ?? false
  const isRial = currency_code && currency_code.toLowerCase() === "irr"
  // Only convert to Toman if Iran features are enabled, the currency is Rial,
  // convertToToman is enabled in settings, AND the current language is Persian.
  if (isIranFeaturesEnabled && isRial && convertToToman && isFa) {
    const tomanAmount = amount / 10

    const formattedNumber = new Intl.NumberFormat(targetLocale, {
      minimumFractionDigits: minimumFractionDigits ?? 0,
      maximumFractionDigits: maximumFractionDigits ?? 0,
    }).format(tomanAmount)

    return `${formattedNumber} ${isFa ? "تومان" : "Toman"}`
  }

  // Default standard formatting
  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(targetLocale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}

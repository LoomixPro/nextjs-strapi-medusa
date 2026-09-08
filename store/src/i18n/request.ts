import { getRequestConfig } from "next-intl/server"

import { loadMessagesForLocale } from "@lib/i18n/load-messages"
import { resolveTimeZone } from "@lib/i18n/resolve-time-zone"

const STATIC_REQUEST_LOCALE = "default"

/**
 * Server-side locale/messages for RSC (`getTranslations`, `getMessages`).
 * Uses a static locale so instant routes are not blocked by cookie access.
 * Cookie-aware locale is applied in `RequestIntlProvider` (inside Suspense).
 */
export default getRequestConfig(async () => {
  const messages = await loadMessagesForLocale(STATIC_REQUEST_LOCALE)

  return {
    locale: STATIC_REQUEST_LOCALE,
    messages,
    timeZone: resolveTimeZone(STATIC_REQUEST_LOCALE),
  }
})

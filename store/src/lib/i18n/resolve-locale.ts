import { readCookie } from "@lib/util/safe-cookies"

import { LOCALE_COOKIE_NAME } from "./load-messages"

/**
 * Resolves locale from cookie during a real request.
 * Use only inside Suspense boundaries (e.g. RequestIntlProvider).
 * Falls back to "default" during static prerender (no cookies).
 */
export async function resolveRequestLocale(): Promise<string> {
  const localeCookie = await readCookie(LOCALE_COOKIE_NAME)

  if (localeCookie && localeCookie !== "default") {
    return localeCookie
  }

  return "default"
}

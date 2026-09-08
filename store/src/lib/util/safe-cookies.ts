import "server-only"

import { cookies as nextCookies } from "next/headers"

function isPrerenderCookieError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false
  }

  const err = error as { digest?: string; message?: string }
  const message = typeof err.message === "string" ? err.message : ""

  return (
    err.digest === "HANGING_PROMISE_REJECTION" ||
    err.digest === "NEXT_PRERENDER_INTERRUPTED" ||
    message.includes("During prerendering, `cookies()` rejects") ||
    message.includes("used `cookies()` inside `generateStaticParams`") ||
    message.includes("without an HTTP request")
  )
}

/**
 * Returns the cookie store during a request, or null during static prerender.
 */
export async function getCookieStore() {
  try {
    return await nextCookies()
  } catch (error) {
    if (isPrerenderCookieError(error)) {
      return null
    }

    throw error
  }
}

export async function readCookie(name: string): Promise<string | undefined> {
  const store = await getCookieStore()
  return store?.get(name)?.value
}

export async function requireCookieStore() {
  const store = await getCookieStore()

  if (!store) {
    throw new Error("Cookies are unavailable outside of a request context.")
  }

  return store
}

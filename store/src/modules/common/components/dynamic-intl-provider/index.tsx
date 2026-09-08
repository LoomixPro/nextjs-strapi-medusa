"use client"

import { NextIntlClientProvider } from "next-intl"
import { useCallback, useEffect, useState } from "react"

import { LOCALE_CHANGE_EVENT } from "@lib/i18n/locale-change-event"
import { LOCAL_MESSAGE_LOADERS } from "@lib/i18n/messages-registry"
import { isRtlLocale } from "@lib/util/is-rtl"
import defaultMessages from "../../../../../messages/default.json"

const LOCALE_COOKIE = "_medusa_locale"

function readLocaleCookie(): string | null {
  if (typeof document === "undefined") {
    return null
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`)
  )

  return match ? decodeURIComponent(match[1]) : null
}

async function loadMessages(locale: string): Promise<Record<string, unknown>> {
  // 1. Direct match from generated loaders
  const directLoader = LOCAL_MESSAGE_LOADERS[locale]
  if (directLoader) {
    try {
      const loaded = await directLoader()
      return loaded.default
    } catch (e) {
      console.warn(
        `[DynamicIntlProvider] Failed loading bundled message file for '${locale}':`,
        e
      )
    }
  }

  // 2. Prefix match (e.g. 'ar' -> 'ar-AE' or 'en' -> 'en-US')
  const matchingKey = Object.keys(LOCAL_MESSAGE_LOADERS).find(
    (key) =>
      key !== "default" &&
      (key.startsWith(`${locale}-`) || locale.startsWith(`${key}-`))
  )
  if (matchingKey && LOCAL_MESSAGE_LOADERS[matchingKey]) {
    try {
      const loaded = await LOCAL_MESSAGE_LOADERS[matchingKey]()
      return loaded.default
    } catch (e) {
      console.warn(
        `[DynamicIntlProvider] Failed loading prefix-matched message file for '${matchingKey}':`,
        e
      )
    }
  }

  // 3. Fallback: Fetch dynamically from /api/messages route
  try {
    const res = await fetch(
      `/api/messages?locale=${encodeURIComponent(locale)}`
    )
    if (res.ok) {
      const data = await res.json()
      if (
        data.success &&
        data.messages &&
        Object.keys(data.messages).length > 0
      ) {
        return data.messages
      }
    }
  } catch (apiErr) {
    console.warn(
      `[DynamicIntlProvider] API message fallback failed for '${locale}':`,
      apiErr
    )
  }

  // 4. Default fallback
  const defaultLoader = LOCAL_MESSAGE_LOADERS.default
  if (defaultLoader) {
    try {
      const loaded = await defaultLoader()
      return loaded.default
    } catch {}
  }

  return defaultMessages as unknown as Record<string, unknown>
}

export default function DynamicIntlProvider({
  children,
  defaultLocale,
  defaultMessages: initialMessages,
  defaultDir,
  timeZone,
}: {
  children: React.ReactNode
  defaultLocale: string
  defaultMessages: Record<string, unknown>
  defaultDir: string
  timeZone: string
}) {
  const [locale, setLocale] = useState(defaultLocale)
  const [messages, setMessages] = useState(initialMessages)
  const [resolvedTimeZone, setResolvedTimeZone] = useState(timeZone)

  const defaultLocaleTag =
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    process.env.DEFAULT_LOCALE ||
    "en-US"

  // Keep client state aligned with server-resolved locale/messages (e.g. after router.refresh).
  useEffect(() => {
    setLocale(defaultLocale)
    setMessages(initialMessages)
    setResolvedTimeZone(timeZone)
    document.documentElement.lang =
      defaultLocale === "default" ? defaultLocaleTag : defaultLocale
    document.documentElement.dir = defaultDir === "rtl" ? "rtl" : "ltr"
  }, [defaultLocale, defaultDir, initialMessages, timeZone, defaultLocaleTag])

  const syncLocaleFromCookie = useCallback(
    async (forcedLocale?: string) => {
      const cookieLocale = forcedLocale || readLocaleCookie()
      const rawLocale = cookieLocale || defaultLocale
      const nextMessages = await loadMessages(rawLocale)

      const isRtl = isRtlLocale(rawLocale, { isRtl: defaultDir === "rtl" })

      setLocale(rawLocale)
      setMessages(nextMessages)
      document.documentElement.lang =
        !rawLocale || rawLocale === "default" ? defaultLocaleTag : rawLocale
      document.documentElement.dir = isRtl ? "rtl" : "ltr"
    },
    [defaultDir, defaultLocale, defaultLocaleTag]
  )

  // Only react to explicit locale changes — never read cookie on mount (avoids hydration mismatch).
  useEffect(() => {
    const onLocaleChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ locale?: string }>
      void syncLocaleFromCookie(customEvent?.detail?.locale)
    }

    window.addEventListener(LOCALE_CHANGE_EVENT, onLocaleChange)

    return () => {
      window.removeEventListener(LOCALE_CHANGE_EVENT, onLocaleChange)
    }
  }, [syncLocaleFromCookie])

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone={resolvedTimeZone}
    >
      {children}
    </NextIntlClientProvider>
  )
}

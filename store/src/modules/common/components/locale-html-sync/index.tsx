"use client"

import { useEffect } from "react"
import { isRtlLocale } from "@lib/util/is-rtl"

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

export default function LocaleHtmlSync({
  locale,
  dir,
}: {
  locale: string
  dir: string
}) {
  const defaultLocaleTag =
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    process.env.DEFAULT_LOCALE ||
    "en-US"

  useEffect(() => {
    const cookieLocale = readLocaleCookie()
    const rawLocale = cookieLocale || locale
    const isRtl = isRtlLocale(rawLocale, { isRtl: dir === "rtl" })

    document.documentElement.lang =
      !rawLocale || rawLocale === "default" ? defaultLocaleTag : rawLocale
    document.documentElement.dir = isRtl ? "rtl" : "ltr"
  }, [locale, dir, defaultLocaleTag])

  return null
}

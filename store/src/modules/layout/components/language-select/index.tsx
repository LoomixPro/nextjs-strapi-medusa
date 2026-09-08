"use client"

import { Transition } from "@headlessui/react"
import { Globe } from "lucide-react"
import { Fragment, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ReactCountryFlag from "react-country-flag"
import { useTranslations } from "next-intl"

import { StateType } from "@lib/hooks/use-toggle-state"
import { updateLocale } from "@lib/data/locale-actions"
import { dispatchLocaleChange } from "@lib/i18n/locale-change-event"
import { Locale } from "@lib/data/locales"

type LanguageOption = {
  code: string
  name: string
  localizedName: string
  countryCode: string
}

const DEFAULT_LOCALE_ENV =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
  process.env.DEFAULT_LOCALE ||
  "en-US"

const getCountryCodeFromLocale = (localeCode: string): string => {
  const code = localeCode === "default" ? DEFAULT_LOCALE_ENV : localeCode
  try {
    const locale = new Intl.Locale(code)
    return (
      locale.region?.toUpperCase() ??
      locale.maximize().region?.toUpperCase() ??
      "US"
    )
  } catch {
    const parts = (code || "").split(/[-_]/)
    return parts.length > 1 ? parts[1].toUpperCase() : parts[0].toUpperCase()
  }
}

type LanguageSelectProps = {
  toggleState: StateType
  locales?: Locale[] | null
  currentLocale?: string | null
  size?: "sm" | "md"
}

/**
 * Gets the localized display name for a language code using Intl API.
 * Falls back to the provided name if Intl is unavailable.
 */
const getLocalizedLanguageName = (
  code: string,
  fallbackName: string,
  displayLocale: string = "en-US"
): string => {
  try {
    const displayNames = new Intl.DisplayNames([displayLocale], {
      type: "language",
    })
    return displayNames.of(code) ?? fallbackName
  } catch {
    return fallbackName
  }
}

const DEFAULT_OPTION: LanguageOption = {
  code: "default",
  name: "Default",
  localizedName: "Default",
  countryCode: getCountryCodeFromLocale("default"),
}

const LanguageSelect = ({
  toggleState,
  locales = [],
  currentLocale,
  size = "md",
}: LanguageSelectProps) => {
  const t = useTranslations("Layout.language_select")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { state, close } = toggleState

  const options = useMemo(() => {
    const defaultCountry = getCountryCodeFromLocale("default")
    const defaultName = getLocalizedLanguageName(
      DEFAULT_LOCALE_ENV,
      t("default") || "Default",
      currentLocale ?? DEFAULT_LOCALE_ENV
    )

    const normalizedDefault = DEFAULT_LOCALE_ENV.toLowerCase()

    const localeOptions = (locales || [])
      .filter((l) => {
        const c = (l.code || "").toLowerCase()
        return (
          c !== "default" &&
          c !== "en" &&
          c !== "en-us" &&
          c !== normalizedDefault
        )
      })
      .map((locale) => ({
        code: locale.code,
        name: locale.name,
        localizedName: getLocalizedLanguageName(
          locale.code,
          locale.name,
          currentLocale ?? DEFAULT_LOCALE_ENV
        ),
        countryCode: getCountryCodeFromLocale(locale.code),
      }))

    const allOptions = [
      {
        code: "default",
        name: defaultName,
        localizedName: defaultName,
        countryCode: defaultCountry,
      },
      ...localeOptions,
    ]

    const seen = new Set<string>()
    return allOptions.filter((opt) => {
      const normalized = opt.code.toLowerCase()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
  }, [locales, currentLocale, t])

  const current = useMemo(() => {
    if (currentLocale) {
      const option = options.find(
        (o) => o.code.toLowerCase() === currentLocale.toLowerCase()
      )
      return option ?? DEFAULT_OPTION
    }
    return DEFAULT_OPTION
  }, [options, currentLocale])

  const handleChange = (option: LanguageOption) => {
    startTransition(async () => {
      await updateLocale(option.code)
      dispatchLocaleChange(option.code)
      close()
      router.refresh()
    })
  }

  return (
    <div className="relative z-50">
      <span className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <button
          type="button"
          onClick={() => (state ? close() : toggleState.open())}
          className={`group relative ${
            size === "sm" ? "h-9 w-9" : "h-10 w-10"
          } rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors text-black dark:text-white focus:outline-none p-0`}
        >
          {current && (
            <div className="flex items-center justify-center w-full h-full rounded-full overflow-hidden">
              {current.countryCode ? (
                /* @ts-ignore */
                <ReactCountryFlag
                  aria-label={current.localizedName || "Language flag"}
                  title={current.localizedName}
                  style={{
                    fontSize: size === "sm" ? "18px" : "20px",
                    lineHeight: "1",
                  }}
                  countryCode={current.countryCode}
                />
              ) : (
                <Globe size={size === "sm" ? 18 : 22} />
              )}
              <span className="sr-only">
                {isPending ? "..." : current.localizedName}
              </span>
            </div>
          )}
        </button>
        <Transition
          show={state}
          as={Fragment}
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 max-h-[442px] overflow-y-scroll bg-white dark:bg-slate-900 drop-shadow-md text-small-regular uppercase text-black dark:text-white no-scrollbar rounded-rounded min-w-[52px] z-50 p-1 border border-gray-100 dark:border-gray-800">
            {options.map((o) => (
              <button
                type="button"
                key={o.code || "default"}
                onClick={() => handleChange(o)}
                className="w-full py-2 hover:bg-gray-200 dark:hover:bg-gray-800 px-3 cursor-pointer flex items-center justify-center gap-x-2 rounded-sm transition-colors"
              >
                {o.countryCode ? (
                  /* @ts-ignore */
                  <ReactCountryFlag
                    aria-label={o.localizedName || "Country flag"}
                    title={o.localizedName}
                    className="shrink-0"
                    style={{
                      fontSize: "16px",
                      lineHeight: "1",
                    }}
                    countryCode={o.countryCode}
                  />
                ) : (
                  <Globe size={16} className="text-gray-500" />
                )}
                <span className="sr-only">{o.localizedName}</span>
              </button>
            ))}
          </div>
        </Transition>
      </span>
    </div>
  )
}

export default LanguageSelect

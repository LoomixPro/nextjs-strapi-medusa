import { getTranslationMessages } from "@lib/data/strapi-settings"
import type { StorefrontSettings } from "@lib/data/strapi-settings"
import { isRtlLocale } from "@lib/util/is-rtl"
import { LOCAL_MESSAGE_LOADERS } from "./messages-registry"
import defaultMessages from "../../../messages/default.json"

function isObject(item: unknown): boolean {
  return !!(item && typeof item === "object" && !Array.isArray(item))
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
) {
  if (!source) {
    return target
  }

  const output = { ...target }

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key]
        } else {
          output[key] = deepMerge(
            target[key] as Record<string, unknown>,
            source[key] as Record<string, unknown>
          )
        }
      } else {
        output[key] = source[key]
      }
    })
  }

  return output
}

export async function loadMessagesForLocale(
  locale: string
): Promise<Record<string, unknown>> {
  let localMessages: Record<string, unknown> = {}

  const directLoader = LOCAL_MESSAGE_LOADERS[locale]
  if (directLoader) {
    try {
      localMessages = (await directLoader()).default
    } catch {
      localMessages = defaultMessages as unknown as Record<string, unknown>
    }
  } else {
    // Try prefix matching (e.g. 'ar' -> 'ar-AE' or 'en' -> 'en-US')
    const matchingKey = Object.keys(LOCAL_MESSAGE_LOADERS).find(
      (key) =>
        key !== "default" &&
        (key.startsWith(`${locale}-`) || locale.startsWith(`${key}-`))
    )
    if (matchingKey && LOCAL_MESSAGE_LOADERS[matchingKey]) {
      try {
        localMessages = (await LOCAL_MESSAGE_LOADERS[matchingKey]()).default
      } catch {
        localMessages = defaultMessages as unknown as Record<string, unknown>
      }
    } else {
      localMessages = defaultMessages as unknown as Record<string, unknown>
    }
  }

  const strapiMessages = await getTranslationMessages(locale)

  return deepMerge(localMessages, strapiMessages ?? {}) as Record<
    string,
    unknown
  >
}

export function resolveDir(
  locale: string,
  settings?: Pick<StorefrontSettings, "isRtl">
): string {
  return isRtlLocale(locale, settings) ? "rtl" : "ltr"
}

export const LOCALE_COOKIE_NAME = "_medusa_locale"

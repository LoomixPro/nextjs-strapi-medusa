import { resolveRequestLocale } from "@lib/i18n/resolve-locale"

export async function getLocaleHeader(
  isStatic = false
): Promise<Record<string, string>> {
  if (isStatic) {
    return {}
  }

  const locale = await resolveRequestLocale()

  if (!locale || locale === "default") {
    return {}
  }

  return {
    "x-medusa-locale": locale,
    "x-locale": locale,
  }
}

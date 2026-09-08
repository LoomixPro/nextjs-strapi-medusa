export const LOCALE_CHANGE_EVENT = "medusa-locale-change"

export function dispatchLocaleChange(locale: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(LOCALE_CHANGE_EVENT, { detail: { locale } })
    )
  }
}

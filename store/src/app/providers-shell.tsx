import { getDictionaryMap, StorefrontSettings } from "@lib/data/strapi-settings"
import { resolveDir } from "@lib/i18n/load-messages"
import { resolveTimeZone } from "@lib/i18n/resolve-time-zone"
import { setServerRequestStore } from "@lib/util/storefront-settings"
import BackgroundRenderer from "@modules/common/components/background"
import CookieConsent from "@modules/common/components/cookie-consent"
import DynamicIntlProvider from "@modules/common/components/dynamic-intl-provider"
import LocaleHtmlSync from "@modules/common/components/locale-html-sync"
import { DictionaryProvider } from "@modules/common/components/dictionary-provider"
import SettingsInitializer from "@modules/common/components/settings-initializer"

export function ProvidersShell({
  children,
  settings,
  locale,
  messages,
  dir,
  dictionary,
}: {
  children: React.ReactNode
  settings: StorefrontSettings
  locale: string
  messages: Record<string, unknown>
  dir: string
  dictionary: Awaited<ReturnType<typeof getDictionaryMap>>
}) {
  setServerRequestStore(locale, settings)

  return (
    <DynamicIntlProvider
      defaultLocale={locale}
      defaultMessages={messages}
      defaultDir={dir}
      timeZone={resolveTimeZone(settings?.timeZone)}
    >
      <LocaleHtmlSync locale={locale} dir={dir} />
      <DictionaryProvider dictionary={dictionary}>
        <SettingsInitializer settings={settings} />
        <BackgroundRenderer backgroundSettings={settings.background} />
        <main className="relative">{children}</main>
        <CookieConsent />
      </DictionaryProvider>
    </DynamicIntlProvider>
  )
}

import { Suspense } from "react"

import { getDictionaryMap, StorefrontSettings } from "@lib/data/strapi-settings"
import { resolveDir } from "@lib/i18n/load-messages"
import { ThemeProvider } from "@modules/common/components/theme-provider"
import ToastProvider from "@modules/common/components/toast-provider"
import defaultMessages from "../../messages/default.json"

import { ProvidersShell } from "./providers-shell"
import { RequestIntlProvider } from "./request-intl-provider"

const FALLBACK_LOCALE = "default"

export default async function RootProviders({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: StorefrontSettings
}) {
  const fallbackDir = resolveDir(FALLBACK_LOCALE, settings)
  const fallbackDictionary = await getDictionaryMap(FALLBACK_LOCALE)

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Suspense
        fallback={
          <ProvidersShell
            locale={FALLBACK_LOCALE}
            messages={defaultMessages}
            dir={fallbackDir}
            dictionary={fallbackDictionary}
            settings={settings}
          >
            {children}
          </ProvidersShell>
        }
      >
        <RequestIntlProvider settings={settings}>
          {children}
        </RequestIntlProvider>
      </Suspense>
      <ToastProvider />
    </ThemeProvider>
  )
}

import { connection } from "next/server"

import { getDictionaryMap, StorefrontSettings } from "@lib/data/strapi-settings"
import { loadMessagesForLocale, resolveDir } from "@lib/i18n/load-messages"
import { resolveRequestLocale } from "@lib/i18n/resolve-locale"

import { ProvidersShell } from "./providers-shell"

export async function RequestIntlProvider({
  children,
  settings,
}: {
  children: React.ReactNode
  settings: StorefrontSettings
}) {
  await connection()

  const locale = await resolveRequestLocale()
  const messages = await loadMessagesForLocale(locale)
  const dir = resolveDir(locale, settings)
  const dictionary = await getDictionaryMap(locale)

  return (
    <ProvidersShell
      locale={locale}
      messages={messages}
      dir={dir}
      dictionary={dictionary}
      settings={settings}
    >
      {children}
    </ProvidersShell>
  )
}

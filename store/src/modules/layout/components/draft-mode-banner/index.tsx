import React from "react"
import { Eye, LogOut } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function DraftModeBanner({
  countryCode,
}: {
  countryCode: string
}) {
  const t = await getTranslations("DraftMode")
  const exitUrl = `/api/disable-preview?redirect=/${countryCode}`

  return (
    <aside
      role="status"
      aria-label={t("aria_label")}
      className="fixed bottom-5 right-5 z-[9999] max-w-[calc(100vw-2.5rem)] sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      <div className="flex items-center gap-3.5 bg-neutral-950/90 text-white px-4 py-3 rounded-2xl shadow-2xl border border-amber-500/30 backdrop-blur-xl ring-1 ring-white/10">
        <div className="relative flex items-center justify-center h-8 w-8 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <Eye className="h-4 w-4" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
          </span>
        </div>

        <div className="flex flex-col text-xs pr-1">
          <span className="font-semibold text-neutral-100 flex items-center gap-1.5">
            {t("title")}
          </span>
          <span className="text-neutral-400 text-[11px] leading-tight mt-0.5">
            {t("description")}
          </span>
        </div>

        <a
          href={exitUrl}
          className="mr-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-900 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-xl transition-all shadow-sm shadow-amber-950/30"
          title={t("exit_tooltip")}
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{t("exit")}</span>
        </a>
      </div>
    </aside>
  )
}

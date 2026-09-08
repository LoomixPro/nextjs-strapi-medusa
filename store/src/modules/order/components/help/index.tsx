import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useTranslations } from "next-intl"
import React from "react"
import { HelpCircle, MessageSquare, RotateCcw } from "lucide-react"

const Help = () => {
  const t = useTranslations("Order")

  return (
    <div className="bg-background border border-border p-6 sm:p-8 rounded-[32px] shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
          <HelpCircle size={18} />
        </div>
        <h3 className="text-base font-semibold text-foreground">{t("help")}</h3>
      </div>

      {/* Stack containing support cards */}
      <div className="flex flex-col gap-4">
        {/* Contact support */}
        <LocalizedClientLink
          href="/contact"
          className="group/help flex items-center gap-4 bg-muted/30 border border-border p-4 rounded-2xl hover:border-primary/20 hover:shadow-xs transition-all duration-300"
        >
          <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover/help:bg-primary group-hover/help:text-primary-foreground transition-colors duration-300 shrink-0">
            <MessageSquare size={18} />
          </div>
          <div className="flex flex-col text-left rtl:text-right min-w-0">
            <span className="text-sm font-semibold text-foreground group-hover/help:text-primary transition-colors">
              {t("contact")}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {t("contact_support")}
            </span>
          </div>
        </LocalizedClientLink>

        {/* Returns and Exchanges */}
        <LocalizedClientLink
          href="/returns"
          className="group/help flex items-center gap-4 bg-muted/30 border border-border p-4 rounded-2xl hover:border-primary/20 hover:shadow-xs transition-all duration-300"
        >
          <div className="p-3 bg-primary/5 text-primary rounded-xl group-hover/help:bg-primary group-hover/help:text-primary-foreground transition-colors duration-300 shrink-0">
            <RotateCcw size={18} />
          </div>
          <div className="flex flex-col text-left rtl:text-right min-w-0">
            <span className="text-sm font-semibold text-foreground group-hover/help:text-primary transition-colors">
              {t("returns")}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
              {t("exchange_returns")}
            </span>
          </div>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Help

"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@medusajs/ui"
import { Cookie, X } from "lucide-react"
import { useTranslations } from "next-intl"

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const t = useTranslations("CookieConsent")

  useEffect(() => {
    // Check if the user has already consented
    const hasConsented = localStorage.getItem("cookie-consent")
    if (hasConsented) return

    // Show only after real user interaction (scroll, touch, click, wheel, keydown) to avoid hijacking LCP
    const interactionEvents: Array<keyof WindowEventMap> = [
      "scroll",
      "touchstart",
      "click",
      "pointerdown",
      "wheel",
      "keydown",
    ]

    const handleInteraction = () => {
      setShowConsent(true)
      cleanup()
    }

    const cleanup = () => {
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleInteraction)
      })
    }

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleInteraction, {
        passive: true,
        once: true,
      })
    })

    return cleanup
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowConsent(false)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowConsent(false)
  }

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[9999] bg-ui-bg-base border-t border-ui-border-base shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-4 text-center rtl:md:text-right ltr:md:text-left flex-1">
            <div className="hidden md:flex p-3 rounded-full bg-ui-bg-component">
              <Cookie className="w-6 h-6 text-ui-fg-interactive" />
            </div>
            <div>
              <h3 className="text-base-semi mb-1">{t("title")}</h3>
              <p className="text-sm text-ui-fg-subtle">{t("description")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              variant="secondary"
              className="flex-1 md:flex-none whitespace-nowrap"
              onClick={handleDecline}
            >
              {t("decline")}
            </Button>
            <Button
              variant="primary"
              className="flex-1 md:flex-none whitespace-nowrap"
              onClick={handleAccept}
            >
              {t("accept")}
            </Button>
            <button
              onClick={handleDecline}
              className="hidden md:flex mr-2 text-ui-fg-muted hover:text-ui-fg-base transition-colors"
              aria-label={t("close")}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

"use client"

import { useTranslations } from "next-intl"

export default function OfflinePage() {
  const t = useTranslations("Offline")
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">📡</div>
      <h1 className="text-3xl font-bold mb-4">{t("title")}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        {t("description")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors dark:bg-white dark:text-black"
      >
        {t("retry")}
      </button>
    </div>
  )
}

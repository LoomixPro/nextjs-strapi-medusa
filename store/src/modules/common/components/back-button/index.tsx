"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useLocale } from "next-intl"
import { isRtlLocale } from "@lib/util/is-rtl"

export default function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const isRtl = isRtlLocale(locale)

  return (
    <button
      onClick={() => router.back()}
      className={`flex items-center justify-center p-2 rounded-full hover:bg-ui-bg-subtle transition-colors text-ui-fg-subtle hover:text-ui-fg-base ${className}`}
      aria-label="Go back"
    >
      {isRtl ? (
        <ArrowRight className="w-5 h-5" />
      ) : (
        <ArrowLeft className="w-5 h-5" />
      )}
    </button>
  )
}

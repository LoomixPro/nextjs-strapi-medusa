"use client"
import { Button } from "@modules/common/components/shadcn/button"

import { useActionState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter } from "next/navigation"
import Input from "@modules/common/components/input"

import { verifyOtp } from "@lib/data/customer"

type Props = {
  phone: string
  onChangePhone: () => void
}

export const Otp = ({ phone, onChangePhone }: Props) => {
  const t = useTranslations("Account.Otp")
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectUrl = searchParams.get("redirect")

  const [state, formAction] = useActionState(
    async (_: any, formData: FormData) => {
      const otp = formData.get("otp") as string
      const result = await verifyOtp({ phone, otp })
      if (result === true) {
        return { success: true }
      }
      return { success: false, error: result as string }
    },
    { success: false, error: undefined }
  )

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "a moment"
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins === 0) return `${secs}s`
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`
  }

  const mapError = (errStr?: string | null) => {
    if (!errStr) return undefined
    const rawLower = errStr.toLowerCase().trim()

    if (rawLower.startsWith("error:")) {
      const [code, val] = rawLower.split("|")
      const seconds = parseInt(val || "0")
      const time = formatTime(seconds)

      if (code === "error:network_rate_limit")
        return t("errors.network_rate_limit", { time })
      if (code === "error:cooldown") return t("errors.cooldown", { time })
      if (code === "error:identifier_rate_limit")
        return t("errors.identifier_rate_limit", { time })
      if (code === "error:login_failed_limit")
        return t("errors.login_failed_limit", { time })
      if (code === "error:otp_verify_limit")
        return t("errors.too_many_verify_attempts", { time })

      if (code === "error:auth_cleanup_refreshed")
        return t("errors.auth_cleanup_refreshed")
      if (code === "error:account_setup_failed")
        return t("errors.account_setup_failed")
      if (code === "error:too_many_otp_requests")
        return t("errors.too_many_otp_requests")
      if (code === "error:send_failed") return t("errors.send_failed")
      if (code === "error:invalid_code") return t("errors.invalid_code")
    }

    const cleanStr = errStr.replace(/^Error:\s*/i, "").trim()
    const lower = cleanStr.toLowerCase()

    if (lower.includes("invalid") || lower.includes("wrong code"))
      return t("errors.invalid_code")
    if (lower.includes("too many incorrect"))
      return t("errors.too_many_verify_attempts")
    if (lower.includes("too many requests") || lower.includes("too many otp"))
      return t("errors.too_many_otp_requests")
    if (lower.includes("expired")) return t("errors.code_expired")
    if (lower.includes("failed to send") || lower.includes("failed to resend"))
      return t("errors.send_failed")
    return cleanStr
  }

  useEffect(() => {
    if (state.success && redirectUrl) {
      router.push(redirectUrl)
    }
  }, [state.success, redirectUrl, router])

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <div className="flex flex-col items-center mb-4 text-center">
        <span className="text-sm text-slate-400 dark:text-zinc-500">
          {t("enter_otp_sent_to", { phone })}
        </span>
        <button
          onClick={onChangePhone}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-1 hover:underline"
          type="button"
        >
          {t("change_phone_number")}
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-y-4">
        <Input
          label={t("code")}
          name="otp"
          type="text"
          autoComplete="one-time-code"
          required
        />
        {state?.error && (
          <div className="text-red-500 text-sm">{mapError(state.error)}</div>
        )}
        <Button
          type="submit"
          className="w-full h-12 rounded-full mt-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          {t("verify_code")}
        </Button>
      </form>
    </div>
  )
}

"use client"
import { Button } from "@modules/common/components/shadcn/button"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Mail } from "lucide-react"
import Input from "@modules/common/components/input"

import { verifyEmailLoginOtp, requestEmailLoginOtp } from "@lib/data/customer"

type Props = {
  email: string
  mode: "login"
  onChangeEmail: () => void
}

export const EmailOtp = ({ email, onChangeEmail }: Props) => {
  const t = useTranslations("Account.Otp")
  const [otp, setOtp] = useState("")
  const [countdown, setCountdown] = useState(120)
  const [canResend, setCanResend] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

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

  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")

  const handleVerify = async () => {
    if (!otp) return
    setIsLoading(true)
    setError(undefined)

    let result: { success: boolean; error?: string }

    result = await verifyEmailLoginOtp({ otp, email })

    if (result.success) {
      // Redirect to account page (or the original destination) after successful verification
      router.push(redirectUrl || "/account")
    } else {
      setError(mapError(result.error))
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setCanResend(false)
    setCountdown(120)
    setOtp("")
    setError(undefined)

    try {
      const res = await requestEmailLoginOtp(email)
      if (res && res.error) {
        setError(mapError(res.error))
      }
    } catch {
      setError(t("errors.resend_failed"))
    }
  }

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <div className="flex flex-col items-center mb-4 text-center">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-500/10 rounded-full mb-3">
          <Mail className="w-6 h-6 text-indigo-400" />
        </div>
        <span className="text-sm text-slate-400 dark:text-zinc-500">
          {t("enter_otp_sent_to_email", { email })}
        </span>
        <button
          onClick={onChangeEmail}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors mt-1 hover:underline"
          type="button"
        >
          {t("change_email")}
        </button>
      </div>

      <Input
        label={t("code")}
        name="otp"
        type="text"
        autoComplete="one-time-code"
        required
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <Button
        type="button"
        onClick={handleVerify}
        isLoading={isLoading}
        className="w-full py-3.5 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/25 border-0 transition-all duration-300 hover:scale-[1.02]"
      >
        {t("verify_code")}
      </Button>

      <div className="flex items-center justify-center mt-1">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors hover:underline"
          >
            {t("resend_code")}
          </button>
        ) : (
          <span className="text-xs text-slate-400 dark:text-zinc-500">
            {t("resend_in", { time: formatTime(countdown) })}
          </span>
        )}
      </div>
    </div>
  )
}

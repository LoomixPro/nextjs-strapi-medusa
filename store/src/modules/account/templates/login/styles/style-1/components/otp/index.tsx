"use client"

import { useActionState, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Smartphone } from "lucide-react"
import { OTPInput, SlotProps } from "input-otp"
import { useSearchParams, useRouter } from "next/navigation"

import { Button } from "@modules/common/components/shadcn/button"
import { verifyOtp, authenticateWithPhone } from "@lib/data/customer"
import { cn } from "@lib/utils"

type Props = {
  phone: string
  onChangePhone: () => void
}

// Slot component for individual OTP digit
function Slot(props: SlotProps) {
  return (
    <div
      className={cn(
        "relative w-10 h-14 text-[2rem]",
        "flex items-center justify-center",
        "transition-all duration-300",
        "border-gray-200 dark:border-zinc-800 border-y border-r first:border-l first:rounded-l-xl last:rounded-r-xl",
        "group-hover:border-blue-400/40 dark:group-hover:border-blue-600/40 group-focus-within:border-blue-400/40 dark:group-focus-within:border-blue-600/40",
        "outline outline-0 outline-blue-500/20 dark:outline-blue-900/30",
        { "outline-4 outline-blue-600 dark:outline-blue-700": props.isActive }
      )}
    >
      <div className="group-has-[input[data-input-otp-placeholder-shown]]:opacity-20">
        {props.char ?? props.placeholderChar}
      </div>
      {props.hasFakeCaret && <FakeCaret />}
    </div>
  )
}

// Fake caret with blink animation
function FakeCaret() {
  return (
    <div className="absolute pointer-events-none inset-0 flex items-center justify-center animate-caret-blink">
      <div className="w-px h-8 bg-blue-600" />
    </div>
  )
}

// Dash separator between 3-digit groups
function FakeDash() {
  return (
    <div className="flex w-10 justify-center items-center">
      <div className="w-3 h-1 rounded-full bg-gray-300 dark:bg-zinc-700" />
    </div>
  )
}

export const Otp = ({ phone, onChangePhone }: Props) => {
  const t = useTranslations("Account.Otp")
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectUrl = searchParams.get("redirect")

  // Only allow relative internal paths — reject absolute/protocol-relative URLs
  const safeRedirectUrl = (url: string | null): string => {
    if (!url || typeof url !== "string") return "/account"
    const trimmed = url.trim()
    return trimmed.startsWith("/") && !trimmed.startsWith("//")
      ? trimmed
      : "/account"
  }

  const [otpValue, setOtpValue] = useState("")
  const [countdown, setCountdown] = useState(120) // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  // Separate state for resend errors (e.g. rate-limit messages)
  const [resendError, setResendError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const [state, formAction, isPending] = useActionState(
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

  useEffect(() => {
    if (state.success) {
      router.push(safeRedirectUrl(redirectUrl))
    }
  }, [state.success, redirectUrl, router])

  const handleResend = async () => {
    if (!canResend || isResending) return

    setIsResending(true)
    setResendError(null)
    setOtpValue("")

    const result = await authenticateWithPhone(phone)

    setIsResending(false)

    if (result === true) {
      // Server accepted the request — restart the countdown
      setCanResend(false)
      setCountdown(120)
    } else {
      // Server rejected (rate-limit or other error) — show the message
      // and keep the button active so the user knows why it failed
      setResendError(result as string)
      setCanResend(true)
    }
  }

  // Format countdown as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
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

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <div className="flex flex-col items-center text-center bg-blue-50/50 dark:bg-blue-950/20 p-6 rounded-3xl border border-blue-100/50 dark:border-blue-900/30">
        <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-500 shadow-sm mb-4">
          <Smartphone size={24} />
        </div>
        <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
          {t("enter_verification_code")}
        </span>
        <span className="text-sm font-bold text-gray-900 dark:text-zinc-100 mb-3">
          {phone}
        </span>
        <button
          onClick={onChangePhone}
          className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-widest transition-colors"
          type="button"
        >
          {t("change_phone_number")}
        </button>
      </div>

      <form action={formAction} className="flex flex-col gap-y-5">
        <div className="flex flex-col items-center gap-y-3">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
            {t("code")}
          </label>
          <div dir="ltr" className="w-full flex justify-center">
            <OTPInput
              maxLength={6}
              value={otpValue}
              onChange={setOtpValue}
              containerClassName="group flex items-center justify-center has-[:disabled]:opacity-30 w-full"
              render={({ slots }) => (
                <div className="flex items-center justify-center">
                  <div className="flex">
                    {slots.slice(0, 3).map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>

                  <FakeDash />

                  <div className="flex">
                    {slots.slice(3).map((slot, idx) => (
                      <Slot key={idx} {...slot} />
                    ))}
                  </div>
                </div>
              )}
            />
          </div>
          <input type="hidden" name="otp" value={otpValue} />
        </div>

        {/* OTP verification error (wrong code, lockout, etc.) */}
        {state?.error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
            {mapError(state.error)}
          </div>
        )}

        <Button
          type="submit"
          isLoading={isPending}
          disabled={otpValue.length < 6}
          className="w-full h-12 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          {t("verify_code")}
        </Button>

        {/* Resend error (rate-limit, cooldown, etc.) */}
        {resendError && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest text-center">
            {mapError(resendError)}
          </div>
        )}

        <div className="flex items-center justify-center">
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {isResending ? "..." : t("resend_code")}
            </button>
          ) : (
            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
              {t("resend_in", { time: formatTime(countdown) })}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

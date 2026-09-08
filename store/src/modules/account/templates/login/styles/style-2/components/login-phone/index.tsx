"use client"
import { Button } from "@modules/common/components/shadcn/button"

import { useActionState, useEffect, useState } from "react"
import { useTranslations } from "next-intl"

import { authenticateWithPhone } from "@lib/data/customer"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

type Props = {
  setCurrentView: (view: any) => void
  onOtpRequired: (phone: string) => void
}

type LoginState = {
  success: boolean
  error?: string | null
  phone?: string
}

const LoginPhone = ({
  setCurrentView: _setCurrentView,
  onOtpRequired,
}: Props) => {
  const t = useTranslations("Account.Login")
  const [phone, setPhone] = useState<string>()

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "a moment"
    if (seconds < 60) return `${seconds}s`
    const mins = Math.ceil(seconds / 60)
    return `${mins}m`
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
    }

    const cleanStr = errStr.replace(/^Error:\s*/i, "").trim()
    const lower = cleanStr.toLowerCase()

    if (
      lower.includes("failed to send") ||
      lower.includes("failed to resend") ||
      lower.includes("please try again")
    ) {
      return t("errors.send_otp_failed")
    }
    if (lower.includes("too many requests") || lower.includes("too many otp")) {
      return t("errors.too_many_otp_requests")
    }

    return cleanStr // fallback
  }

  const [state, formAction] = useActionState<LoginState, FormData>(
    async (_currentState, formData) => {
      const phoneValue = formData.get("phone") as string
      const result = await authenticateWithPhone(phoneValue)
      if (result === true) {
        return { success: true, phone: phoneValue, error: null }
      }
      return { success: false, error: result as string, phone: undefined }
    },
    { success: false, error: null, phone: undefined }
  )

  useEffect(() => {
    if (state.success && state.phone) {
      onOtpRequired(state.phone)
    }
  }, [state, onOtpRequired])

  return (
    <div className="flex flex-col gap-y-4 w-full">
      <style>{`
        [dir="rtl"] .PhoneInputCountry {
          margin-right: 0;
          margin-left: var(--PhoneInputCountrySelectMarginRight, 0.5em);
        }
        [dir="rtl"] .PhoneInputCountrySelectArrow {
          margin-left: 0;
          margin-right: var(--PhoneInputCountrySelectArrowMarginLeft, 0.35em);
        }
      `}</style>
      <form action={formAction} className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2">
          <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest ms-1">
            {t("phone")}
          </label>
          <PhoneInput
            placeholder={t("phone")}
            value={phone}
            onChange={setPhone}
            name="phone"
            required
            defaultCountry="IR"
            internationalIcon={() => null}
            className="flex h-12 w-full rounded-xl border border-gray-200 dark:border-zinc-700/50 bg-white/50 dark:bg-zinc-900/50 px-3 py-2 text-sm backdrop-blur-sm transition-all focus-within:border-indigo-500 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 dark:focus-within:ring-indigo-900/20 outline-none [&_input]:outline-none [&_input]:border-none [&_input]:bg-transparent text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500"
          />
        </div>
        {state?.error && (
          <div className="text-red-500 text-sm">{mapError(state.error)}</div>
        )}
        <Button
          type="submit"
          className="w-full h-12 rounded-full mt-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          {t("send_otp")}
        </Button>
      </form>
    </div>
  )
}

export default LoginPhone

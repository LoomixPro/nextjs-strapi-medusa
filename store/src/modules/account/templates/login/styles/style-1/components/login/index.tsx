"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useParams } from "next/navigation"

import Input from "@modules/common/components/input"
import { Button } from "@modules/common/components/shadcn/button"
import {
  login,
  requestEmailLoginOtp,
  loginWithGoogle,
} from "@lib/data/customer"

type Props = {
  setCurrentView: (view: any) => void
  onEmailOtpRequired?: (email: string) => void
}

const Login = ({ setCurrentView, onEmailOtpRequired }: Props) => {
  const t = useTranslations("Account.Login")
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get("redirect")
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : ""

  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)

  const [message, formAction, isPending] = useActionState(login, null)

  const formatTime = (seconds: number) => {
    if (!seconds || seconds <= 0) return "a moment"
    if (seconds < 60) return `${seconds}s`
    const mins = Math.ceil(seconds / 60)
    return `${mins}m`
  }

  const mapError = (errStr?: string | null) => {
    if (!errStr) return undefined
    const rawLower = errStr.toLowerCase().trim()

    // Parse new error codes (e.g., "error:network_rate_limit|1200")
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
      lower.includes("invalid email or password") ||
      lower.includes("invalid credentials")
    )
      return t("errors.invalid_credentials")
    if (lower.includes("failed to send")) return t("errors.send_otp_failed")

    return cleanStr // fallback
  }

  const handleLoginWithOtp = async (formData: FormData) => {
    const email = formData.get("email") as string
    if (!email) {
      setOtpError(t("email_required") ?? "Email is required")
      return
    }
    setOtpLoading(true)
    setOtpError(null)
    const result = await requestEmailLoginOtp(email)
    setOtpLoading(false)
    if (result.success && onEmailOtpRequired) {
      onEmailOtpRequired(email)
    } else {
      setOtpError(result.error ?? "Failed to send OTP")
    }
  }

  return (
    <div className="flex flex-col gap-y-6 w-full">
      <form action={loginWithGoogle} className="w-full">
        <Button
          type="submit"
          className="w-full h-12 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 48 48"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          Continue with Google
        </Button>
      </form>

      <div className="flex items-center my-[-10px]">
        <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
        <span className="px-3 text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">
          OR
        </span>
        <div className="flex-grow border-t border-gray-200 dark:border-zinc-800"></div>
      </div>
      <form
        action={formAction}
        id="login-email-form"
        className="flex flex-col gap-y-5"
      >
        {redirectUrl && (
          <input type="hidden" name="redirect" value={redirectUrl} />
        )}
        {/* Pass countryCode so the server action can redirect to /[cc]/account */}
        {countryCode && (
          <input type="hidden" name="countryCode" value={countryCode} />
        )}

        {/* Honeypot: hidden field that only bots fill in */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-9999px",
            opacity: 0,
            pointerEvents: "none",
            height: 0,
            overflow: "hidden",
          }}
        >
          <input
            type="text"
            name="_hp_name"
            tabIndex={-1}
            autoComplete="off"
            aria-label="Do not fill this field"
          />
        </div>

        <div className="flex flex-col gap-y-4">
          <Input
            label={t("email")}
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Input
            label={t("password")}
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>

        {(message || otpError) && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
            {mapError(message || otpError)}
          </div>
        )}

        <div className="flex justify-end w-full mt-[-8px]">
          <button
            type="button"
            onClick={() => setCurrentView("forgot-password")}
            className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            {t("forgot_password_link") ?? "Forgot password?"}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isPending}
          className="w-full h-12 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
        >
          {t("sign_in")}
        </Button>

        {/* Login with OTP code */}
        {onEmailOtpRequired && (
          <button
            type="button"
            disabled={otpLoading}
            onClick={() => {
              const form = document.getElementById(
                "login-email-form"
              ) as HTMLFormElement | null
              if (form) handleLoginWithOtp(new FormData(form))
            }}
            className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 uppercase tracking-widest transition-colors text-center disabled:opacity-50"
          >
            {otpLoading
              ? "..."
              : (t("login_with_otp") ?? "Login with one-time code")}
          </button>
        )}
      </form>
    </div>
  )
}

export default Login

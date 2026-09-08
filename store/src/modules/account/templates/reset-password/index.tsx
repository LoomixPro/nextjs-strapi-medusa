"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

import { Button } from "@modules/common/components/shadcn/button"
import { resetPassword } from "@lib/data/customer"

type Props = {
  token?: string
  email?: string
}

export default function ResetPasswordTemplate({ token, email }: Props) {
  const t = useTranslations("Account.ResetPassword")
  const router = useRouter()
  const params = useParams()
  const countryCode =
    typeof params?.countryCode === "string" ? params.countryCode : ""
  const accountPath = countryCode ? `/${countryCode}/account` : "/account"

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Map structured server errors and known strings to user-friendly messages.
  // The server returns result.error strings — we handle them here directly
  // without re-parsing for substrings to avoid brittle double-mapping.
  const mapError = (errStr?: string | null) => {
    if (!errStr) return undefined
    const lower = errStr.toLowerCase()
    if (lower.includes("expired") || lower.includes("invalid"))
      return t("errors.expired_link")
    if (lower.includes("mismatch") || lower.includes("match"))
      return t("errors.password_mismatch")
    // Return as-is for any other message (stripped of leading 'Error:')
    return errStr.replace(/^Error:\s*/i, "").trim()
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!token || !email) {
      setError(t("errors.missing_token"))
      return
    }

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (password !== confirmPassword) {
      setError(t("errors.password_mismatch"))
      return
    }

    if (password.length < 8) {
      setError(t("errors.password_too_short"))
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await resetPassword({ email, token, password })

    if (result.success) {
      // Upon successful reset, redirect to account with correct countryCode
      router.push(accountPath)
    } else {
      setError(result.error ?? t("errors.generic"))
      setIsLoading(false)
    }
  }

  if (!token || !email) {
    return (
      <div className="w-full flex justify-center items-center min-h-[80vh] px-4 py-16 bg-gray-50/30 dark:bg-zinc-950/20">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-gray-100/50 dark:border-zinc-800/50 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-zinc-100 mb-2">
            {t("invalid_link_title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6">
            {t("invalid_link_description")}
          </p>
          <Button onClick={() => router.push(accountPath)} className="w-full">
            {t("back_to_login")}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex justify-center items-center min-h-[80vh] px-4 py-16 bg-gray-50/30 dark:bg-zinc-950/20">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] shadow-sm border border-gray-100/50 dark:border-zinc-800/50 overflow-hidden">
        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-500">
              <Lock strokeWidth={1.5} size={28} />
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-zinc-100 mb-2 tracking-tight">
              {t("set_new_password")}
            </h1>
            <p className="text-sm text-gray-400 dark:text-zinc-500 max-w-[280px] mx-auto leading-relaxed font-light">
              {t("set_new_password_description")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                required
                placeholder=" "
                autoComplete="new-password"
                className="peer w-full border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 pt-6 pb-2 text-sm text-gray-900 dark:text-zinc-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all"
              />
              <label
                htmlFor="password"
                className="absolute top-2 ltr:left-4 rtl:right-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-zinc-500 transition-all pointer-events-none"
              >
                {t("new_password")}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                id="confirmPassword"
                required
                placeholder=" "
                autoComplete="new-password"
                className="peer w-full border border-gray-200 dark:border-zinc-800 rounded-2xl px-4 pt-6 pb-2 text-sm text-gray-900 dark:text-zinc-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all"
              />
              <label
                htmlFor="confirmPassword"
                className="absolute top-2 ltr:left-4 rtl:right-4 text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-500 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:normal-case peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-zinc-500 transition-all pointer-events-none"
              >
                {t("confirm_password")}
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest text-center">
                {mapError(error)}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 mt-2 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 !bg-blue-600 hover:!bg-blue-700 text-white transition-all active:scale-95 border-none"
            >
              {isLoading ? t("resetting") : t("reset_password")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

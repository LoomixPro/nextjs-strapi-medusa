"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Mail, CheckCircle } from "lucide-react"
import { Button } from "@modules/common/components/shadcn/button"
import { requestPasswordReset } from "@lib/data/customer"

type Props = {
  onBack: () => void
}

export const ForgotPassword = ({ onBack }: Props) => {
  const t = useTranslations("Account.ForgotPassword")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    setError(undefined)

    await requestPasswordReset(email)

    // Always show success (security: don't reveal if email exists)
    setSent(true)
    setIsLoading(false)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="w-14 h-14 bg-green-50 dark:bg-green-950/30 rounded-2xl flex items-center justify-center">
          <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 mb-2">
            {t("email_sent_title")}
          </h3>
          <p className="text-sm text-gray-400 dark:text-zinc-500 leading-relaxed">
            {t("email_sent_description", { email })}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors"
        >
          {t("back_to_login")}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      <div className="relative">
        <input
          type="email"
          id="reset-email-s1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder=" "
          autoComplete="email"
          className="peer w-full border border-gray-200 dark:border-zinc-700 rounded-xl px-4 pt-5 pb-2 text-sm text-gray-900 dark:text-zinc-100 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
        />
        <label
          htmlFor="reset-email-s1"
          className="absolute top-2 ltr:left-4 rtl:right-4 text-[10px] font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:uppercase-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-gray-400 transition-all pointer-events-none"
        >
          {t("email_label")}
        </label>
        <Mail className="absolute ltr:right-4 rtl:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 dark:text-zinc-600" />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all"
      >
        {isLoading ? t("sending") : t("send_reset_link")}
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center mt-1"
      >
        {t("back_to_login")}
      </button>
    </form>
  )
}

export default ForgotPassword

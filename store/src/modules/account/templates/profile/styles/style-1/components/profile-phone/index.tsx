"use client"

import React, { useEffect, useState } from "react"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { requestPhoneUpdateOtp, verifyPhoneUpdateOtp } from "@lib/data/customer"
import { useTranslations } from "next-intl"
import { formatPhoneOrEmail } from "@lib/util/phone"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const t = useTranslations("Account.Profile")
  const tPhone = useTranslations("Account.profile_phone")

  const [successState, setSuccessState] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [phone, setPhone] = useState<string>(
    (customer.phone ?? "").replace(/[^0-9+]/g, "")
  )
  const [step, setStep] = useState<"input" | "verify">("input")
  const [countdown, setCountdown] = useState(0)

  // Sync phone state if customer prop changes
  useEffect(() => {
    setPhone((customer.phone ?? "").replace(/[^0-9+]/g, ""))
  }, [customer.phone])

  // Timer countdown for resending code
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  const handleFormAction = async (formData: FormData) => {
    setErrorMsg(null)
    setSuccessState(false)

    if (step === "input") {
      const inputPhone = phone?.trim()
      if (!inputPhone) {
        setErrorMsg(tPhone("phone_required"))
        return
      }

      // If the phone number is the same, simply close the edit form
      if (inputPhone === customer.phone) {
        setSuccessState(true)
        return
      }

      const res = await requestPhoneUpdateOtp(inputPhone)
      if (res.success) {
        setStep("verify")
        setCountdown(60)
      } else {
        if (res.error === "duplicate") {
          setErrorMsg(tPhone("phone_exists"))
        } else if (res.error === "rate_limit") {
          setErrorMsg(tPhone("rate_limit"))
        } else {
          setErrorMsg(res.error || tPhone("send_error"))
        }
      }
    } else {
      const inputPhone = phone?.trim()
      const inputCode = (formData.get("code") as string)?.trim()

      if (!inputCode) {
        setErrorMsg(tPhone("code_required"))
        return
      }

      const res = await verifyPhoneUpdateOtp(inputPhone, inputCode)
      if (res.success) {
        setSuccessState(true)
        setStep("input")
      } else {
        if (res.error === "invalid_code") {
          setErrorMsg(tPhone("code_invalid"))
        } else if (res.error === "duplicate") {
          setErrorMsg(tPhone("phone_exists"))
        } else {
          setErrorMsg(res.error || tPhone("verify_error"))
        }
      }
    }
  }

  const handleResend = async () => {
    setErrorMsg(null)
    const inputPhone = phone?.trim()
    if (!inputPhone) return

    const res = await requestPhoneUpdateOtp(inputPhone)
    if (res.success) {
      setCountdown(60)
    } else {
      if (res.error === "duplicate") {
        setErrorMsg(tPhone("phone_exists"))
      } else if (res.error === "rate_limit") {
        setErrorMsg(tPhone("rate_limit"))
      } else {
        setErrorMsg(res.error || tPhone("send_error"))
      }
    }
  }

  const clearState = () => {
    setSuccessState(false)
    setErrorMsg(null)
    setStep("input")
    setPhone(customer.phone ?? "")
  }

  return (
    <form action={handleFormAction} className="w-full">
      <AccountInfo
        label={t("phone_number")}
        currentInfo={
          <span dir="ltr" className="inline-block">
            {formatPhoneOrEmail(null, customer.phone)}
          </span>
        }
        isSuccess={successState}
        isError={!!errorMsg}
        errorMessage={errorMsg || ""}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        {step === "input" ? (
          <div className="flex flex-col w-full relative">
            <label className="absolute -top-2 ltr:left-3 rtl:right-3 px-1 text-[10px] font-bold text-gray-400 dark:text-zinc-500 bg-background dark:bg-zinc-950 uppercase tracking-widest z-10 transition-all">
              {t("phone")} <span className="text-rose-500">*</span>
            </label>
            <PhoneInput
              placeholder={t("phone")}
              value={phone}
              onChange={(value) => setPhone(value || "")}
              name="phone"
              required
              defaultCountry="IR"
              internationalIcon={() => null}
              className="flex h-11 w-full rounded-xl border border-border dark:border-zinc-700 bg-background dark:bg-zinc-800/50 px-4 py-1 text-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 outline-none [&_input]:outline-none [&_input]:border-none [&_input]:bg-transparent text-sm font-normal text-foreground dark:text-zinc-100"
              data-testid="phone-input"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-y-4">
            <div className="text-xs text-muted-foreground dark:text-zinc-400 mb-2">
              {tPhone("code_sent", { phone })}
            </div>
            <Input
              label={tPhone("edit_phone") || "Code"}
              name="code"
              type="text"
              required
              autoFocus
              maxLength={6}
              pattern="\d{6}"
              data-testid="otp-code-input"
            />
            <div className="flex items-center justify-between text-xs mt-2 px-1">
              {countdown > 0 ? (
                <span className="text-muted-foreground dark:text-zinc-500">
                  {tPhone("resend_in", { countdown })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-primary hover:underline font-semibold"
                >
                  {tPhone("resend_code")}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setStep("input")
                  setErrorMsg(null)
                }}
                className="text-muted-foreground hover:text-foreground hover:underline dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                {tPhone("edit_phone")}
              </button>
            </div>
          </div>
        )}
      </AccountInfo>
    </form>
  )
}

export default ProfilePhone

"use client"

import { useState } from "react"
import Login from "./components/login"
import LoginPhone from "./components/login-phone"
import { Otp } from "./components/otp"
import { EmailOtp } from "./components/otp-email"
import { ForgotPassword } from "./components/forgot-password"
import { Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  EMAIL_OTP = "email-otp",
  SIGN_IN_PHONE = "sign-in-phone",
  OTP = "otp",
  FORGOT_PASSWORD = "forgot-password",
}

export type AuthMethod = "EMAIL" | "PHONE"
export type LoginMethods = "email" | "phone" | "both"

const LoginStyle2 = ({
  loginMethods = "email",
}: {
  loginMethods?: LoginMethods
}) => {
  const showEmail = loginMethods === "email" || loginMethods === "both"
  const showPhone = loginMethods === "phone" || loginMethods === "both"
  const showTabs = loginMethods === "both"

  const defaultView = showPhone ? LOGIN_VIEW.SIGN_IN_PHONE : LOGIN_VIEW.SIGN_IN
  const defaultMethod: AuthMethod = showPhone ? "PHONE" : "EMAIL"

  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(defaultView)
  const [method, setMethod] = useState<AuthMethod>(defaultMethod)
  const [otpPhone, setOtpPhone] = useState("")
  const [otpEmail, setOtpEmail] = useState("")

  const t = useTranslations("Account.Login")

  const handleMethodChange = (m: AuthMethod) => {
    setMethod(m)
    setCurrentView(
      m === "EMAIL" ? LOGIN_VIEW.SIGN_IN : LOGIN_VIEW.SIGN_IN_PHONE
    )
  }

  const handleOtpRequired = (phone: string) => {
    setOtpPhone(phone)
    setCurrentView(LOGIN_VIEW.OTP)
  }

  const handleEmailOtpRequired = (email: string) => {
    setOtpEmail(email)
    setCurrentView(LOGIN_VIEW.EMAIL_OTP)
  }

  const isLoginView =
    currentView === LOGIN_VIEW.SIGN_IN ||
    currentView === LOGIN_VIEW.SIGN_IN_PHONE

  const getTitle = () => {
    if (currentView === LOGIN_VIEW.EMAIL_OTP || currentView === LOGIN_VIEW.OTP)
      return t("verify_account") ?? "Verify"
    if (currentView === LOGIN_VIEW.FORGOT_PASSWORD)
      return t("forgot_password") ?? "Forgot Password"
    return t("secure_login")
  }

  const getSubtitle = () => {
    if (currentView === LOGIN_VIEW.EMAIL_OTP)
      return t("enter_email_otp") ?? "Enter the code sent to your email"
    if (currentView === LOGIN_VIEW.OTP)
      return t("enter_phone_otp") ?? "Enter the code sent to your phone"
    if (currentView === LOGIN_VIEW.FORGOT_PASSWORD)
      return (
        t("forgot_password_text") ?? "Enter your email to receive a reset link"
      )
    return t("access_account_text")
  }

  return (
    <div className="relative w-full flex justify-center items-center min-h-[80vh] px-4 py-16 overflow-hidden">
      {/* Decorative Orbs */}
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-400/40 dark:bg-indigo-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70"
      />
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute top-1/3 right-1/4 w-72 h-72 bg-purple-400/40 dark:bg-purple-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70"
      />
      <motion.div
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -50, 20, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-pink-400/40 dark:bg-pink-600/30 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-3xl opacity-70"
      />

      <div className="relative w-full max-w-md group z-10">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative backdrop-blur-2xl bg-white/70 dark:bg-zinc-950/70 rounded-[2rem] p-8 sm:p-10 border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          {/* Shield Icon */}
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-white/50 dark:border-white/10 shadow-inner">
              <Shield
                className="w-10 h-10 text-indigo-600 dark:text-indigo-400"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* Header */}
          <h2 className="text-3xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {getTitle()}
          </h2>
          <p className="text-gray-500 dark:text-zinc-400 text-center text-sm mb-8 font-medium">
            {getSubtitle()}
          </p>

          {/* Tab Bar — only when both methods are enabled */}
          {isLoginView && showTabs && (
            <div className="grid grid-cols-2 gap-2 mb-8 bg-gray-100/50 dark:bg-zinc-900/50 p-1 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-white/5">
              <button
                onClick={() => handleMethodChange("EMAIL")}
                className={`py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  method === "EMAIL"
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-zinc-700/50"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t("email")}
              </button>
              <button
                onClick={() => handleMethodChange("PHONE")}
                className={`py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                  method === "PHONE"
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-gray-200/50 dark:border-zinc-700/50"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {t("phone_short")}
              </button>
            </div>
          )}

          {/* Content */}
          <div className="relative">
            {currentView === LOGIN_VIEW.SIGN_IN && showEmail && (
              <Login
                setCurrentView={setCurrentView}
                onEmailOtpRequired={handleEmailOtpRequired}
              />
            )}
            {currentView === LOGIN_VIEW.SIGN_IN_PHONE && showPhone && (
              <LoginPhone
                setCurrentView={setCurrentView}
                onOtpRequired={handleOtpRequired}
              />
            )}
            {currentView === LOGIN_VIEW.OTP && (
              <Otp
                phone={otpPhone}
                onChangePhone={() => {
                  setCurrentView(LOGIN_VIEW.SIGN_IN_PHONE)
                }}
              />
            )}

            {currentView === LOGIN_VIEW.EMAIL_OTP && (
              <EmailOtp
                email={otpEmail}
                mode="login"
                onChangeEmail={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              />
            )}
            {currentView === LOGIN_VIEW.FORGOT_PASSWORD && (
              <ForgotPassword
                onBack={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginStyle2

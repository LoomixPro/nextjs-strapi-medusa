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
import { ImageSlider } from "@modules/common/components/image-slider"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  EMAIL_OTP = "email-otp",
  SIGN_IN_PHONE = "sign-in-phone",
  OTP = "otp",
  FORGOT_PASSWORD = "forgot-password",
}

export type AuthMethod = "EMAIL" | "PHONE"
export type LoginMethods = "email" | "phone" | "both"

const LoginStyle3 = ({
  loginMethods = "email",
  images = [],
}: {
  loginMethods?: LoginMethods
  images?: string[]
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
    <div className="relative w-full flex justify-center items-center min-h-[calc(100vh-80px)] px-4 py-8 overflow-hidden">
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

      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-5xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl rounded-[2rem] border border-white/50 dark:border-white/10 shadow-2xl overflow-hidden min-h-[600px]">
        {/* Form Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 relative z-10">
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

        {/* Left Panel - Image Slider (hidden on smaller screens, renders on the left in RTL) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-zinc-900/10 dark:bg-zinc-900/50">
          {images && images.length > 0 ? (
            <ImageSlider
              images={images}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-500/10 flex flex-col justify-center items-center p-12">
              <h1 className="text-4xl font-bold text-indigo-600 mb-4">
                Welcome
              </h1>
              <p className="text-xl text-center text-muted-foreground">
                Please configure images in the Strapi admin panel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginStyle3

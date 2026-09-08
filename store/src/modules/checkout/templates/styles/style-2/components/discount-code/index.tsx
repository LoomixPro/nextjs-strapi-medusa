"use client"

import { Badge, Heading, Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { useCartRefresh } from "@lib/hooks/use-cart-refresh"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import ErrorMessage from "@/modules/checkout/templates/styles/style-2/components/components/error-message"
import { SubmitButton } from "@/modules/checkout/templates/styles/style-1/components/submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

const DiscountCode: React.FC<DiscountCodeProps> = ({ cart }) => {
  const t = useTranslations("Checkout")
  const refreshCart = useCartRefresh()
  const [isOpen, setIsOpen] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")
  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
    refreshCart()
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
      refreshCart()
    } catch (e: any) {
      setErrorMessage(e.message)
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="w-full flex flex-col bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl px-6 py-5 rounded-[24px] border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(31,38,135,0.05)]">
      <div className="txt-medium">
        <form action={(a) => addPromotionCode(a)} className="w-full mb-2">
          <div className="flex gap-x-1 mb-4 items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="flex items-center gap-x-2 text-[12px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              data-testid="add-discount-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              {t("add_promotion")}
            </button>
          </div>

          <div
            className={`grid transition-all duration-300 ease-in-out ${
              isOpen
                ? "grid-rows-[1fr] opacity-100 mb-4"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="relative w-full mt-2 group shadow-sm hover:shadow-md transition-shadow duration-300 rounded-2xl">
                <div className="absolute inset-y-0 ltr:left-0 rtl:right-0 ltr:pl-4 rtl:pr-4 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z"
                    />
                  </svg>
                </div>
                <input
                  id="promotion-input"
                  name="code"
                  type="text"
                  autoFocus={false}
                  data-testid="discount-input"
                  className="w-full h-14 ltr:pl-11 ltr:pr-[120px] rtl:pr-11 rtl:pl-[120px] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 rounded-2xl text-sm transition-all duration-300 focus:outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white/60 dark:focus:bg-zinc-900/60 focus:ring-4 focus:ring-indigo-500/20 text-gray-800 dark:text-zinc-100 placeholder:text-gray-500 font-mono uppercase tracking-widest"
                  placeholder={t("discount_code_placeholder")}
                />
                <div className="absolute inset-y-1.5 ltr:right-1.5 rtl:left-1.5">
                  <SubmitButton
                    variant="secondary"
                    className="h-full px-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-lg shadow-indigo-500/20 !m-0 !py-0 flex items-center justify-center border-0"
                    data-testid="discount-apply-button"
                  >
                    {t("apply")}
                  </SubmitButton>
                </div>
              </div>

              <ErrorMessage
                error={errorMessage}
                data-testid="discount-error-message"
              />
            </div>
          </div>
        </form>

        {promotions.length > 0 && (
          <div className="w-full flex items-center mt-4 pt-4 border-t border-white/40 dark:border-zinc-800/50">
            <div className="flex flex-col w-full">
              <Heading className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 dark:text-zinc-500 mb-3">
                {t("promotions_applied")}
              </Heading>

              {promotions.map((promotion) => {
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between w-full bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md border border-white/50 dark:border-zinc-800/50 p-3 rounded-xl mb-2"
                    data-testid="discount-row"
                  >
                    <Text className="flex gap-x-2 items-center text-sm w-4/5 pr-1 font-mono">
                      <span
                        className="truncate flex items-center gap-2"
                        data-testid="discount-code"
                      >
                        <Badge
                          color={promotion.is_automatic ? "green" : "purple"}
                          size="small"
                        >
                          {promotion.code}
                        </Badge>
                        <span className="text-gray-500 dark:text-zinc-400">
                          {promotion.application_method?.value !== undefined &&
                            promotion.application_method.currency_code !==
                              undefined && (
                              <>
                                (
                                {promotion.application_method.type ===
                                "percentage"
                                  ? `${promotion.application_method.value}%`
                                  : convertToLocale({
                                      amount:
                                        +promotion.application_method.value,
                                      currency_code:
                                        promotion.application_method
                                          .currency_code,
                                    })}
                                )
                              </>
                            )}
                        </span>
                      </span>
                    </Text>
                    {!promotion.is_automatic && (
                      <button
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors"
                        onClick={() => {
                          if (!promotion.code) {
                            return
                          }

                          removePromotionCode(promotion.code)
                        }}
                        data-testid="remove-discount-button"
                      >
                        <Trash size={14} />
                        <span className="sr-only">{t("remove_promotion")}</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DiscountCode

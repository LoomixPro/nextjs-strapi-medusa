"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import { Heading, Text } from "@medusajs/ui"
import ErrorMessage from "../components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "../components/payment-container"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useState } from "react"
import { getNextIncompleteStep } from "../components/checkout-step"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const t = useTranslations("Checkout")
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession: any) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    activeSession?.provider_id ?? ""
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const currentStep =
    searchParams.get("step") || (cart ? getNextIncompleteStep(cart) : null)
  const isOpen = currentStep === "payment"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOpen ? (
        <section>
          <div>
            <Heading
              level="h2"
              className="text-2xl font-bold tracking-tight mb-2 text-foreground"
            >
              {t("payment_method")}
            </Heading>
            <p className="text-muted-foreground text-sm">
              {t("payment_details")}
            </p>
          </div>

          <div className="mt-6">
            <div className="block">
              {!paidByGiftcard && availablePaymentMethods?.length && (
                <RadioGroup
                  value={selectedPaymentMethod}
                  onChange={(value: string) => setPaymentMethod(value)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {availablePaymentMethods.map((paymentMethod) => (
                    <div key={paymentMethod.id}>
                      {isStripeLike(paymentMethod.id) ? (
                        <StripeCardContainer
                          paymentProviderId={paymentMethod.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                          paymentInfoMap={paymentInfoMap}
                          setError={setError}
                          setCardComplete={setCardComplete}
                        />
                      ) : (
                        <PaymentContainer
                          paymentInfoMap={paymentInfoMap}
                          paymentProviderId={paymentMethod.id}
                          selectedPaymentOptionId={selectedPaymentMethod}
                        />
                      )}
                    </div>
                  ))}
                </RadioGroup>
              )}

              {paidByGiftcard && (
                <div className="flex flex-col w-1/3">
                  <Text className="txt-medium-plus text-foreground mb-1">
                    {t("payment_method")}
                  </Text>
                  <Text
                    className="txt-medium text-muted-foreground"
                    data-testid="payment-method-summary"
                  >
                    {t("gift_card")}
                  </Text>
                </div>
              )}

              <ErrorMessage
                error={error}
                data-testid="payment-method-error-message"
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  onClick={handleSubmit}
                  className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={
                    (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
                    (!selectedPaymentMethod && !paidByGiftcard) ||
                    isLoading
                  }
                  data-testid="submit-payment-button"
                >
                  {!activeSession && isStripeLike(selectedPaymentMethod)
                    ? t("enter_card_details_short")
                    : t("review_order")}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default Payment

"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { Heading, Text } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "../components/payment-container"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { getNextIncompleteStep } from "../components/checkout-step"
import { useCheckoutPayment } from "@modules/checkout/hooks/use-checkout-payment"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: any
  availablePaymentMethods: any[]
}) => {
  const t = useTranslations("Checkout")
  const searchParams = useSearchParams()

  const currentStep =
    searchParams.get("step") || (cart ? getNextIncompleteStep(cart) : null)
  const isOpen = currentStep === "payment"

  const {
    activeSession,
    isLoading,
    error,
    setError,
    cardComplete,
    setCardComplete,
    selectedPaymentMethod,
    setPaymentMethod,
    paidByGiftcard,
    handleSubmit,
  } = useCheckoutPayment(cart, isOpen)

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

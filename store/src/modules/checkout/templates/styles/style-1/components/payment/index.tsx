"use client"

import { RadioGroup } from "@headlessui/react"
import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import { Container, Heading, Text, clx } from "@medusajs/ui"
import { Button } from "@modules/common/components/shadcn/button"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@/modules/checkout/templates/styles/style-1/components/payment-container"
import Divider from "@modules/common/components/divider"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
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
  const isOpen = searchParams.get("step") === "payment"

  const {
    activeSession,
    isLoading,
    error,
    setError,
    cardBrand,
    setCardBrand,
    cardComplete,
    setCardComplete,
    selectedPaymentMethod,
    setPaymentMethod,
    paidByGiftcard,
    paymentReady,
    handleEdit,
    handleSubmit,
  } = useCheckoutPayment(cart, isOpen)

  return (
    <div>
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline text-foreground",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          {t("payment")}
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-primary hover:text-primary/80 transition-colors"
              data-testid="edit-payment-button"
            >
              {t("edit")}
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
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
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-foreground mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-muted-foreground"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            className="w-full sm:w-fit h-12 px-8 rounded-full mt-6 font-bold uppercase tracking-widest transition-all"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? t("enter_card_details")
              : t("continue_to_review")}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-foreground mb-1">
                  {t("payment_method")}
                </Text>
                <Text
                  className="txt-medium text-muted-foreground"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-foreground mb-1">
                  {t("payment_details")}
                </Text>
                <div
                  className="flex gap-2 txt-medium text-muted-foreground items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-muted rounded-md">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : t("another_step")}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-foreground mb-1">
                Payment method
              </Text>
              <Text
                className="txt-medium text-muted-foreground"
                data-testid="payment-method-summary"
              >
                Gift card
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment

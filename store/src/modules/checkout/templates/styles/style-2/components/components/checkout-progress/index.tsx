"use client"

import { HttpTypes } from "@medusajs/types"
import StepIndicator from "../step-indicator"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { getNextIncompleteStep } from "../checkout-step"

type CheckoutProgressProps = {
  cart: HttpTypes.StoreCart
}

const CheckoutProgress = ({ cart }: CheckoutProgressProps) => {
  const t = useTranslations("Checkout")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const stepOrder = ["address", "delivery", "payment", "review"]

  const currentStep = searchParams.get("step") || getNextIncompleteStep(cart)

  const handleStepChange = (step: string) => {
    if (stepOrder.indexOf(step) < stepOrder.indexOf(currentStep)) {
      router.push(pathname + "?step=" + step)
    }
  }

  return (
    <div className="flex flex-wrap gap-8 border-b border-border pb-8 overflow-x-auto">
      <StepIndicator
        label={t("shipping_address")}
        step="address"
        currentStep={currentStep}
        active={true}
        onStepChange={handleStepChange}
        index={1}
        disabled={false}
      />
      <StepIndicator
        label={t("delivery")}
        step="delivery"
        currentStep={currentStep}
        active={!!cart.shipping_address}
        onStepChange={handleStepChange}
        index={2}
        disabled={stepOrder.indexOf(currentStep) < 1}
      />
      <StepIndicator
        label={t("payment")}
        step="payment"
        currentStep={currentStep}
        active={
          !!cart.shipping_address && (cart.shipping_methods?.length ?? 0) > 0
        }
        onStepChange={handleStepChange}
        index={3}
        disabled={stepOrder.indexOf(currentStep) < 2}
      />
      <StepIndicator
        label={t("review")}
        step="review"
        currentStep={currentStep}
        active={
          !!cart.shipping_address &&
          (cart.shipping_methods?.length ?? 0) > 0 &&
          !!cart.payment_collection
        }
        onStepChange={handleStepChange}
        index={4}
        disabled={stepOrder.indexOf(currentStep) < 3}
      />
    </div>
  )
}

export default CheckoutProgress

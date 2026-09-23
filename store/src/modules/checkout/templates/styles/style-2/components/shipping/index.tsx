"use client"

import { RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/storefront-settings"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import ErrorMessage from "@modules/checkout/components/error-message"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect } from "react"
import { getNextIncompleteStep } from "../components/checkout-step"
import { useCheckoutShipping } from "@modules/checkout/hooks/use-checkout-shipping"

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const t = useTranslations("Checkout")
  const searchParams = useSearchParams()

  const currentStep =
    searchParams.get("step") || (cart ? getNextIncompleteStep(cart) : null)
  const isOpen = currentStep === "delivery"

  const {
    isLoading,
    isLoadingPrices,
    calculatedPricesMap,
    error,
    setError,
    shippingMethodId,
    setShippingMethodId,
    shippingMethods,
    handleSubmit,
  } = useCheckoutShipping(cart, availableShippingMethods)

  const handleSetShippingMethod = async (id: string) => {
    setError(null)
    let currentId: string | null = null
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id }).catch(
      (err) => {
        setShippingMethodId(currentId)
        setError(err.message)
      }
    )
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOpen ? (
        <section>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
              {t("delivery_method")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("delivery_method_description")}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <RadioGroup
              value={shippingMethodId}
              onChange={(v) => {
                if (v) handleSetShippingMethod(v)
              }}
            >
              <div className="space-y-4">
                {shippingMethods.map((option) => {
                  const isDisabled =
                    option.price_type === "calculated" &&
                    !isLoadingPrices &&
                    typeof calculatedPricesMap[option.id] !== "number"

                  return (
                    <RadioGroup.Option
                      key={option.id}
                      value={option.id}
                      disabled={isDisabled}
                      className={({ checked }) =>
                        clx(
                          "flex items-center justify-between p-4 border-2 bg-card rounded-2xl cursor-pointer transition-all",
                          {
                            "border-primary bg-accent": checked,
                            "border-border hover:border-muted-foreground":
                              !checked,
                            "opacity-60 cursor-not-allowed": isDisabled,
                          }
                        )
                      }
                    >
                      {({ checked }) => (
                        <>
                          <div className="flex items-center gap-4">
                            <div
                              className={clx(
                                "w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                                {
                                  "bg-primary": checked,
                                  "border-2 border-border": !checked,
                                }
                              )}
                            >
                              {checked && (
                                <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold">{option.name}</p>
                              {/* <p className="text-xs text-gray-500">Fast delivery (3-5 business days)</p> */}
                            </div>
                          </div>
                          <span
                            className={clx("font-black text-sm", {
                              "text-green-600 uppercase tracking-tighter":
                                option.amount === 0,
                            })}
                          >
                            {option.price_type === "flat" ? (
                              convertToLocale({
                                amount: option.amount!,
                                currency_code: cart?.currency_code,
                              })
                            ) : calculatedPricesMap[option.id] ? (
                              convertToLocale({
                                amount: calculatedPricesMap[option.id],
                                currency_code: cart?.currency_code,
                              })
                            ) : isLoadingPrices ? (
                              <Loader className="animate-spin" />
                            ) : (
                              "-"
                            )}
                          </span>
                        </>
                      )}
                    </RadioGroup.Option>
                  )
                })}
              </div>
            </RadioGroup>
          </div>

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <button
              onClick={handleSubmit}
              disabled={!cart.shipping_methods?.[0] || isLoading}
              className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
              data-testid="submit-delivery-option-button"
            >
              {isLoading ? (
                <Loader className="animate-spin" />
              ) : (
                t("continue_to_payment")
              )}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default Shipping

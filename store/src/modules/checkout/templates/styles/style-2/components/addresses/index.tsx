"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useToggleState } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { HttpTypes } from "@medusajs/types"
import { setAddresses } from "@lib/data/cart"
import compareAddresses from "@lib/util/compare-addresses"
import ErrorMessage from "@/modules/checkout/templates/styles/style-1/components/error-message"
import ShippingAddress from "../shipping-address"
import BillingAddress from "../billing_address"
import { getNextIncompleteStep } from "../components/checkout-step"

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const t = useTranslations("Checkout")
  const searchParams = useSearchParams()

  const currentStep =
    searchParams.get("step") || (cart ? getNextIncompleteStep(cart) : null)
  const isOpen = currentStep === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isOpen ? (
        <section>
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
              {t("shipping_info")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("shipping_info_description")}
            </p>
          </div>

          <form action={formAction}>
            <div className="mt-6">
              <ShippingAddress
                customer={customer}
                checked={sameAsBilling}
                onChange={toggleSameAsBilling}
                cart={cart}
              />

              {!sameAsBilling && (
                <div className="mt-6 pt-6 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <h3 className="text-lg font-bold tracking-tight text-foreground">
                    {t("billing_address_title")}
                  </h3>
                  <BillingAddress cart={cart} />
                </div>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold hover:opacity-90 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                  data-testid="submit-address-button"
                >
                  {t("continue_to_delivery")}
                </button>
                <ErrorMessage
                  error={message}
                  data-testid="address-error-message"
                />
              </div>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  )
}

export default Addresses

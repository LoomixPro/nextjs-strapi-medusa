"use client"

import { Heading } from "@medusajs/ui"
import { Button } from "@modules/common/components/shadcn/button"
import { useTranslations } from "next-intl"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@/modules/common/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const t = useTranslations("Cart")

  return (
    <div className="flex flex-col gap-y-4">
      <Heading
        level="h2"
        className="text-2xl small:text-[2rem] leading-8 small:leading-[2.75rem]"
      >
        {t("summary")}
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="w-full block"
      >
        <Button className="w-full h-14 rounded-full font-bold uppercase tracking-widest transition-all">
          {t("checkout")}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary

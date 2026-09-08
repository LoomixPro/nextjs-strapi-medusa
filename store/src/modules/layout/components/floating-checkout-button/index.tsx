"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ShoppingBag } from "@medusajs/icons"
import { usePathname } from "next/navigation"

type FloatingCheckoutButtonProps = {
  cart: HttpTypes.StoreCart | null
}

const FloatingCheckoutButton = ({ cart }: FloatingCheckoutButtonProps) => {
  const t = useTranslations("Cart")
  const pathname = usePathname()

  // Don't show if cart is empty or we don't have items
  if (!cart || !cart.items || cart.items.length === 0) {
    return null
  }

  // Hide on checkout or cart pages where the button is redundant
  if (pathname.includes("/checkout") || pathname.includes("/cart")) {
    return null
  }

  const totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <LocalizedClientLink href="/checkout?step=address" passHref>
        <button
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg bg-ui-bg-base border border-ui-border-base hover:bg-ui-bg-subtle transition-transform hover:scale-105 active:scale-95"
          aria-label={t("checkout")}
        >
          <ShoppingBag className="w-6 h-6 text-ui-fg-base" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-ui-bg-interactive text-ui-fg-on-inverted text-[11px] font-bold shadow-sm ring-2 ring-ui-bg-base">
            {totalItems}
          </span>
        </button>
      </LocalizedClientLink>
    </div>
  )
}

export default FloatingCheckoutButton

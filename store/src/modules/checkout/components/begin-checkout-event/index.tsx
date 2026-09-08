"use client"

import { useEffect, useRef } from "react"
import { sendGTMEvent } from "@next/third-parties/google"
import { HttpTypes } from "@medusajs/types"

type BeginCheckoutEventProps = {
  cart: HttpTypes.StoreCart
}

export default function BeginCheckoutEvent({ cart }: BeginCheckoutEventProps) {
  const hasFiredFor = useRef<string | null>(null)

  useEffect(() => {
    if (!cart || !cart.items?.length || hasFiredFor.current === cart.id) return
    hasFiredFor.current = cart.id

    sendGTMEvent({
      event: "begin_checkout",
      ecommerce: {
        currency: cart.currency_code?.toUpperCase() || "USD",
        value: cart.total || 0,
        items: cart.items.map((item) => ({
          item_id: item.variant?.product_id || item.id,
          item_variant_id: item.variant_id,
          item_name: item.product_title || item.title,
          price: item.unit_price || 0,
          quantity: item.quantity,
        })),
      },
    })
  }, [cart])

  return null
}

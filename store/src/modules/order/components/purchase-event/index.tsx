"use client"

import { useEffect, useRef } from "react"
import { sendGTMEvent } from "@next/third-parties/google"
import { HttpTypes } from "@medusajs/types"

interface PurchaseEventProps {
  order: HttpTypes.StoreOrder
}

export default function PurchaseEvent({ order }: PurchaseEventProps) {
  const hasFiredFor = useRef<string | null>(null)

  useEffect(() => {
    if (!order.items?.length || hasFiredFor.current === order.id) return
    hasFiredFor.current = order.id

    sendGTMEvent({
      event: "purchase",
      ecommerce: {
        transaction_id: order.display_id?.toString() ?? order.id,
        value: order.total || 0,
        tax: order.tax_total || 0,
        shipping: order.shipping_total || 0,
        currency: order.currency_code?.toUpperCase() ?? "USD",
        items: order.items.map((item) => ({
          item_id: item.variant?.product_id ?? item.id,
          item_variant_id: item.variant_id,
          item_name: item.product_title ?? item.title,
          price: item.unit_price || 0,
          quantity: item.quantity,
        })),
      },
    })
  }, [order])

  return null
}

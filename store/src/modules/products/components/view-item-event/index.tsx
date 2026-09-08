"use client"

import { useEffect, useRef } from "react"
import { sendGTMEvent } from "@next/third-parties/google"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"

interface ViewItemEventProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}

export default function ViewItemEvent({ product, region }: ViewItemEventProps) {
  const hasFiredFor = useRef<string | null>(null)

  useEffect(() => {
    // Prevent duplicate firing in React StrictMode (development) or multiple re-renders
    if (hasFiredFor.current === product.id) return
    hasFiredFor.current = product.id

    const { cheapestPrice } = getProductPrice({ product })

    sendGTMEvent({
      event: "view_item",
      ecommerce: {
        currency: region.currency_code.toUpperCase(),
        value:
          (cheapestPrice?.calculated_price_number as number | undefined) ?? 0,
        items: [
          {
            item_id: product.id,
            item_name: product.title,
            item_category: product.collection?.title ?? "",
            price:
              (cheapestPrice?.calculated_price_number as number | undefined) ??
              0,
            quantity: 1,
          },
        ],
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    product.id,
    region.currency_code,
    product.title,
    product.collection?.title,
  ])

  return null
}

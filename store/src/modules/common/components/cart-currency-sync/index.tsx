"use client"

import { useEffect, useRef } from "react"
import { syncCartCurrency } from "@lib/data/cart"

export default function CartCurrencySync({ cart }: { cart: any }) {
  const hasAttemptedSync = useRef(false)

  useEffect(() => {
    if (
      cart &&
      cart.region &&
      cart.currency_code !== cart.region.currency_code &&
      !hasAttemptedSync.current
    ) {
      hasAttemptedSync.current = true
      syncCartCurrency()
    }
  }, [cart])

  return null
}

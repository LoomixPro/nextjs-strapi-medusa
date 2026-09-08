"use client"

import { useEffect } from "react"

import { updateStoreProductCount } from "./store-product-count-cache"

export default function SyncProductCount({ count }: { count: number }) {
  useEffect(() => {
    updateStoreProductCount(count)
  }, [count])

  return null
}

"use client"

import { clearCartCookie } from "@lib/data/cart"
import { useEffect } from "react"

export default function ClearCartOnMount() {
  useEffect(() => {
    void clearCartCookie()
  }, [])

  return null
}

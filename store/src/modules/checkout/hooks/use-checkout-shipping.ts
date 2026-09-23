"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"

export function formatAddress(
  address: HttpTypes.StoreCartAddress | undefined | null
): string {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city || ""}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

export function useCheckoutShipping(
  cart: HttpTypes.StoreCart,
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const shippingMethods = availableShippingMethods || []

  useEffect(() => {
    setIsLoadingPrices(true)

    if (shippingMethods?.length) {
      const promises = shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              const val = (p as PromiseFulfilledResult<any>).value
              if (val?.id) {
                pricesMap[val.id] = val.amount ?? val.price ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      } else {
        setIsLoadingPrices(false)
      }
    } else {
      setIsLoadingPrices(false)
    }
  }, [availableShippingMethods, cart.id])

  const handleSetShippingMethod = async (id: string) => {
    setError(null)
    setIsLoading(true)
    try {
      await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
    } catch (err: any) {
      setError(err?.message || "Failed to set shipping method.")
    } finally {
      setIsLoading(false)
    }
  }

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(
        searchParams ? searchParams.toString() : ""
      )
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "delivery"), {
      scroll: false,
    })
  }

  const handleSubmit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  return {
    isLoading,
    isLoadingPrices,
    calculatedPricesMap,
    error,
    setError,
    shippingMethodId,
    setShippingMethodId,
    shippingMethods,
    handleSetShippingMethod,
    handleEdit,
    handleSubmit,
    createQueryString,
  }
}

"use client"

import { addToCart } from "@lib/data/cart"
import { useCartRefresh } from "@lib/hooks/use-cart-refresh"
import { HttpTypes } from "@medusajs/types"
import { toast } from "sonner"
import isEqual from "lodash/isEqual"
import { sendGTMEvent } from "@next/third-parties/google"
import { getProductPrice } from "@lib/util/get-product-price"
import { useRouter, useSearchParams, useParams } from "next/navigation"
import { useEffect, useMemo, useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { isColorTitle, buildColorCodeMap } from "@lib/util/product-colors"

// Helper to map variant options array to a key-value object (option_id -> value)
const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    const key = varopt.option_id || varopt.option?.id
    if (key) {
      acc[key] = varopt.value
    }
    return acc
  }, {})
}

/**
 * Custom hook to manage product interactions such as variant selection,
 * color/size choosing, inventory checking, and adding to the cart.
 * It also handles syncing the selected variant ID with the URL query parameters.
 *
 * @param product - The store product data
 * @param disabled - Optional boolean to disable actions (e.g., if product is unavailable)
 * @returns An object containing state and handlers for product actions
 */
export const useProductActions = ({
  product,
}: {
  product: HttpTypes.StoreProduct
  disabled?: boolean
}) => {
  const t = useTranslations("Product.actions")
  const router = useRouter()
  const refreshCart = useCartRefresh()
  const searchParams = useSearchParams()
  const countryCode = useParams().countryCode as string

  // Synchronously initialize options from URL query param `v_id` or first variant
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => {
      const vId = searchParams.get("v_id")
      if (vId && product.variants?.length) {
        const matched = product.variants.find((v) => v.id === vId)
        if (matched) return optionsAsKeymap(matched.options) || {}
      }
      if (product.variants?.length) {
        return optionsAsKeymap(product.variants[0].options) ?? {}
      }
      return {}
    }
  )

  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)

  // Track the most recent user-selected variant ID to prevent stale URL query params
  // from resetting state during Next.js router.replace transitions.
  const lastUpdatedVariantIdRef = useRef<string | null>(null)
  const prevVIdRef = useRef<string | null>(searchParams.get("v_id"))

  // Build color code map from metadata using shared helper
  const colorCodeMap = useMemo(() => {
    return buildColorCodeMap(product)
  }, [product])

  const colorOption = product.options?.find((o) => isColorTitle(o.title))
  const nonColorOptions = useMemo(() => {
    return product.options?.filter((o) => !isColorTitle(o.title)) || []
  }, [product.options])

  // Sync options from URL on external navigation (e.g., browser Back / Forward buttons)
  useEffect(() => {
    const currentVId = searchParams.get("v_id")
    if (currentVId === prevVIdRef.current) return
    prevVIdRef.current = currentVId

    // If this URL change is catching up to the user's action in this component, ignore
    if (currentVId === lastUpdatedVariantIdRef.current) {
      lastUpdatedVariantIdRef.current = null
      return
    }

    if (currentVId && product.variants?.length) {
      const variant = product.variants.find((v) => v.id === currentVId)
      if (variant) {
        const nextOptions = optionsAsKeymap(variant.options) || {}
        setOptions((prev) => (isEqual(prev, nextOptions) ? prev : nextOptions))
      }
    }
  }, [product.variants, searchParams])

  // Determine the currently selected variant based on the chosen options
  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Update URL and notify listeners immediately when selectedVariant changes
  useEffect(() => {
    if (!selectedVariant?.id) return

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("product:variant-change", {
          detail: { variantId: selectedVariant.id },
        })
      )
    }

    const currentVId = searchParams.get("v_id")
    if (currentVId === selectedVariant.id) return

    lastUpdatedVariantIdRef.current = selectedVariant.id
    prevVIdRef.current = selectedVariant.id

    const params = new URLSearchParams(searchParams.toString())
    params.set("v_id", selectedVariant.id)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [selectedVariant?.id, router, searchParams])

  /**
   * Handles changing the color option. It attempts to find a variant
   * with the new color and the same previously selected size. If not found,
   * it falls back to the first available variant with the new color.
   */
  const handleColorChange = useCallback(
    (colorValue: string) => {
      if (!colorOption) return

      // 1. Try to find a variant with the same size but new color
      const newOptions = { ...options, [colorOption.id]: colorValue }
      let targetVariant = product.variants?.find((v) =>
        isEqual(optionsAsKeymap(v.options), newOptions)
      )

      // 2. Fallback: If combination doesn't exist, find the first variant with that color
      if (!targetVariant) {
        targetVariant = product.variants?.find((v) => {
          const vOptions = optionsAsKeymap(v.options)
          return vOptions[colorOption.id] === colorValue
        })
      }

      // 3. Update options state
      if (targetVariant) {
        lastUpdatedVariantIdRef.current = targetVariant.id
        setOptions(optionsAsKeymap(targetVariant.options) || {})
      } else {
        setOptions(newOptions)
      }
    },
    [colorOption, options, product.variants]
  )

  // Listen for external color select events (e.g. from mobile gallery color swatches)
  useEffect(() => {
    const handleSelectColorEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ colorValue: string }>
      if (customEvent.detail?.colorValue) {
        handleColorChange(customEvent.detail.colorValue)
      }
    }

    window.addEventListener("product:select-color", handleSelectColorEvent)
    return () => {
      window.removeEventListener("product:select-color", handleSelectColorEvent)
    }
  }, [handleColorChange])

  // Check if the currently selected combination of options corresponds to an existing variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // Check if the selected variant is currently in stock or allows backorders
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    return (selectedVariant?.inventory_quantity || 0) > 0
  }, [selectedVariant])

  const maxStock = selectedVariant?.inventory_quantity || 10

  /**
   * Adds the currently selected variant to the cart with the specified quantity.
   * Also triggers a Google Tag Manager event for tracking.
   */
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    const error = await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    if (error) {
      toast.error(error.includes("inventory") ? t("inventory_error") : error)
    } else {
      toast.success(t("added_to_cart"))
      refreshCart()

      const priceData = getProductPrice({
        product,
        variantId: selectedVariant.id,
      })

      sendGTMEvent({
        event: "add_to_cart",
        ecommerce: {
          currency:
            priceData?.variantPrice?.currency_code?.toUpperCase() || "USD",
          value:
            (priceData?.variantPrice?.calculated_price_number || 0) * quantity,
          items: [
            {
              item_id: product.id,
              item_variant_id: selectedVariant.id,
              item_name: product.title,
              item_category: product.collection?.title || "",
              price: priceData?.variantPrice?.calculated_price_number || 0,
              quantity: quantity,
            },
          ],
        },
      })
    }

    setIsAdding(false)
  }

  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({ ...prev, [optionId]: value }))
  }

  return {
    options,
    setOptions,
    isAdding,
    quantity,
    setQuantity,
    colorCodeMap,
    colorOption,
    nonColorOptions,
    selectedVariant,
    handleColorChange,
    isValidVariant,
    inStock,
    maxStock,
    handleAddToCart,
    setOptionValue,
  }
}

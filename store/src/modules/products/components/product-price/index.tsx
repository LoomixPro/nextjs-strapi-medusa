import { useTranslations, useLocale } from "next-intl"

import { getProductPrice } from "@lib/util/get-product-price"
import { getActiveSettings } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const t = useTranslations("Product.price")
  const locale = useLocale()
  const settings = getActiveSettings()
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
    locale,
    settings,
  }) as {
    cheapestPrice: {
      calculated_price: string
      calculated_price_number: number
      original_price: string
      original_price_number: number
      price_type: string
    } | null
    variantPrice: {
      calculated_price: string
      calculated_price_number: number
      original_price: string
      original_price_number: number
      price_type: string
    } | null
  }

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span className="text-lg font-semibold">
        {!variant && t("from")}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
          suppressHydrationWarning
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {selectedPrice.price_type === "sale" && (
        <span
          className="line-through text-ui-fg-subtle text-sm"
          data-testid="original-product-price"
          data-value={selectedPrice.original_price_number}
          suppressHydrationWarning
        >
          {selectedPrice.original_price}
        </span>
      )}
    </div>
  )
}

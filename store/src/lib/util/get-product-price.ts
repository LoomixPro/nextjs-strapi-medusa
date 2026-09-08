import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./storefront-settings"

/**
 * Extracts and formats price details for a specific product variant.
 * Calculates formatted strings for the current and original prices,
 * and determines the discount percentage if applicable.
 *
 * @param variant - The product variant containing calculated_price data
 * @param locale - Optional locale string for currency formatting
 * @param settings - Optional settings, e.g., to determine if Toman conversion is needed
 * @returns Formatted price object or null if no price is available
 */
export const getPricesForVariant = (
  variant: any,
  locale?: string,
  settings?: { convertToToman?: boolean } | null
) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  return {
    calculated_price_number: variant.calculated_price.calculated_amount,
    calculated_price: convertToLocale({
      amount: variant.calculated_price.calculated_amount,
      currency_code: variant.calculated_price.currency_code,
      locale,
      settings,
    }),
    original_price_number: variant.calculated_price.original_amount,
    original_price: convertToLocale({
      amount: variant.calculated_price.original_amount,
      currency_code: variant.calculated_price.currency_code,
      locale,
      settings,
    }),
    currency_code: variant.calculated_price.currency_code,
    price_type: variant.calculated_price.calculated_price?.price_list_type,
    percentage_diff: getPercentageDiff(
      variant.calculated_price.original_amount,
      variant.calculated_price.calculated_amount
    ),
  }
}

/**
 * Retrieves pricing information for a product.
 * It computes both the price for a specific variant (if variantId is provided)
 * and the cheapest available price across all variants of the product.
 *
 * @param params - Object containing product, variantId, locale, and settings
 * @returns Object with the original product, cheapest price, and specific variant price
 */
export function getProductPrice({
  product,
  variantId,
  locale,
  settings,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
  locale?: string
  settings?: { convertToToman?: boolean } | null
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  // Function to find the cheapest variant and return its formatted price
  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant = product.variants
      .filter((v: any) => !!v.calculated_price)
      .sort((a: any, b: any) => {
        return (
          a.calculated_price.calculated_amount -
          b.calculated_price.calculated_amount
        )
      })[0]

    return getPricesForVariant(cheapestVariant, locale, settings)
  }

  // Function to find the requested variant by ID/SKU and return its formatted price
  const variantPrice = () => {
    if (!variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant, locale, settings)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}

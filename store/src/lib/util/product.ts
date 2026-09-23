import { HttpTypes } from "@medusajs/types"
import { isColorTitle } from "./product-colors"

/**
 * Checks if a product is simple (has only one option with a single value).
 * Simple products don't require variant selection before adding to cart.
 *
 * @param product - The store product data
 * @returns True if the product is simple, false otherwise
 */
export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
  return (
    product.options?.length === 1 && product.options[0].values?.length === 1
  )
}

export interface ProductOptionGroup {
  name: string
  values: string[]
}

/**
 * Extracts all non-color variant options and their unique values from a product
 * (e.g. Size, Material, etc.)
 */
export const getNonColorOptions = (
  options?: HttpTypes.StoreProduct["options"]
): ProductOptionGroup[] => {
  if (!options || !Array.isArray(options)) return []

  return options.reduce((acc, opt: any) => {
    const optionTitle = opt.title?.toLowerCase()
    if (
      !optionTitle ||
      isColorTitle(optionTitle) ||
      optionTitle === "default option"
    )
      return acc

    const optionName = opt.title

    const values = opt.value
      ? [opt.value]
      : opt.values?.map((v: any) => (typeof v === "string" ? v : v.value)) || []

    values.forEach((originalValue: string) => {
      if (!originalValue) return

      const optionValue = originalValue.toLowerCase()
      if (optionValue === "default option value") return

      // Find or create option group
      let optionGroup = acc.find((g: any) => g.name === optionName)
      if (!optionGroup) {
        optionGroup = { name: optionName, values: [] }
        acc.push(optionGroup)
      }

      // Add unique values only
      if (!optionGroup.values.includes(originalValue)) {
        optionGroup.values.push(originalValue)
      }
    })

    return acc
  }, [] as ProductOptionGroup[])
}

/**
 * Resolves the images to display for a selected variant or falls back to product images.
 */
export function resolveVariantImages(
  product?: HttpTypes.StoreProduct,
  variantId?: string | null,
  fallbackImages?: HttpTypes.StoreProductImage[]
): HttpTypes.StoreProductImage[] {
  if (!product?.variants?.length) {
    return fallbackImages && fallbackImages.length > 0
      ? fallbackImages
      : product?.images || []
  }

  const targetVariant = variantId
    ? product.variants.find((v) => v.id === variantId)
    : product.variants[0]

  if (targetVariant?.images && targetVariant.images.length > 0) {
    const imageIdsMap = new Map(targetVariant.images.map((i) => [i.id, true]))
    const filtered = (product.images || fallbackImages)?.filter((i) =>
      imageIdsMap.has(i.id)
    )
    if (filtered && filtered.length > 0) {
      return filtered
    }
    return targetVariant.images as HttpTypes.StoreProductImage[]
  }

  return fallbackImages && fallbackImages.length > 0
    ? fallbackImages
    : product.images || []
}

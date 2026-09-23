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
 * Resolves the appropriate images to display in the product gallery.
 * Supports both signatures:
 * 1. resolveVariantImages(product, variantId, fallbackImages)
 * 2. resolveVariantImages(productImages, variants, activeVariantId)
 */
export function resolveVariantImages(
  product?: HttpTypes.StoreProduct,
  variantId?: string | null,
  fallbackImages?: HttpTypes.StoreProductImage[]
): HttpTypes.StoreProductImage[]
export function resolveVariantImages(
  productImages: HttpTypes.StoreProductImage[],
  variants: HttpTypes.StoreProductVariant[],
  activeVariantId?: string | null
): HttpTypes.StoreProductImage[]
export function resolveVariantImages(
  firstArg?: HttpTypes.StoreProduct | HttpTypes.StoreProductImage[],
  secondArg?: string | null | HttpTypes.StoreProductVariant[],
  thirdArg?: HttpTypes.StoreProductImage[] | string | null
): HttpTypes.StoreProductImage[] {
  let productImages: HttpTypes.StoreProductImage[] = []
  let variants: HttpTypes.StoreProductVariant[] = []
  let activeVariantId: string | null = null

  if (Array.isArray(firstArg)) {
    // Signature 2: (productImages, variants, activeVariantId)
    productImages = firstArg || []
    variants = Array.isArray(secondArg) ? secondArg : []
    activeVariantId = typeof thirdArg === "string" ? thirdArg : null
  } else {
    // Signature 1: (product, variantId, fallbackImages)
    const product = firstArg
    activeVariantId = typeof secondArg === "string" ? secondArg : null
    const fallbackImages = Array.isArray(thirdArg) ? thirdArg : []

    variants = product?.variants || []
    productImages =
      fallbackImages.length > 0 ? fallbackImages : product?.images || []
  }

  if (!activeVariantId && variants.length > 0) {
    activeVariantId = variants[0]?.id
  }

  const activeVariant = variants.find((v) => v.id === activeVariantId)

  // 1. If variant explicitly specifies images, use them
  if (activeVariant?.images && activeVariant.images.length > 0) {
    const imageIdsMap = new Map(activeVariant.images.map((i) => [i.id, true]))
    const filtered = productImages.filter((i) => imageIdsMap.has(i.id))
    if (filtered.length > 0) {
      return filtered
    }
    return activeVariant.images as HttpTypes.StoreProductImage[]
  }

  // 2. If variant has options (e.g. Color, Finish, Accents, Grind Size), check matching images
  if (activeVariant) {
    const primaryOption =
      activeVariant.options?.find(
        (o: any) =>
          o.option?.title?.toLowerCase().includes("color") ||
          o.option?.title?.toLowerCase().includes("colour") ||
          o.option?.title?.toLowerCase().includes("finish") ||
          o.option?.title?.toLowerCase().includes("accent") ||
          o.option?.title?.toLowerCase().includes("grind") ||
          o.title?.toLowerCase().includes("color") ||
          o.title?.toLowerCase().includes("finish")
      ) || activeVariant.options?.[0]

    const optValue = primaryOption?.value?.toLowerCase()

    if (optValue) {
      const matchedImages = productImages.filter((img) => {
        const metadataColor = (img.metadata?.color as string)?.toLowerCase()
        const urlMatch = img.url
          ?.toLowerCase()
          .includes(optValue.replace(/\s+/g, "-"))
        return metadataColor === optValue || urlMatch
      })
      if (matchedImages.length > 0) {
        return matchedImages
      }
    }
  }

  // 3. Fallback to product images or first variant's images
  if (productImages.length > 0) {
    return productImages
  }

  if (variants[0]?.images && variants[0].images.length > 0) {
    return variants[0].images as HttpTypes.StoreProductImage[]
  }

  return []
}

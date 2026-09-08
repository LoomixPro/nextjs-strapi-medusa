import { HttpTypes } from "@medusajs/types"

/**
 * Helper to determine if an option title represents a Color option (English or Persian).
 */
export const isColorTitle = (title?: string): boolean => {
  if (!title) return false
  const t = title.trim().toLowerCase()
  return t === "color" || t === "colors"
}

/**
 * Builds a Map of lowercase color name -> hex color code strictly from product variants metadata (color_code).
 */
export function buildColorCodeMap(
  product: HttpTypes.StoreProduct
): Map<string, string> {
  const map = new Map<string, string>()
  product.variants?.forEach((variant) => {
    const colorOpt = variant.options?.find(
      (opt: any) => isColorTitle(opt.title) || isColorTitle(opt.option?.title)
    )
    if (colorOpt?.value) {
      const colorValue = colorOpt.value.toLowerCase()
      const metadata = variant.metadata || (variant as any).user_metadata
      if (!map.has(colorValue) && metadata?.color_code) {
        map.set(colorValue, metadata.color_code as string)
      }
    }
  })
  return map
}

import { HttpTypes } from "@medusajs/types"

/**
 * Common color name -> hex mapping fallback for when variant metadata is absent.
 */
export const COLOR_NAME_FALLBACKS: Record<string, string> = {
  "cognac tan": "#9E5B32",
  "obsidian black": "#171717",
  "washed black": "#262626",
  "chalk white": "#F5F5F0",
  white: "#FFFFFF",
  black: "#111111",
  "camel tan": "#C19A6B",
  "charcoal grey": "#36454F",
  charcoal: "#36454F",
  grey: "#808080",
  gray: "#808080",
  oatmeal: "#DBCBB8",
  "sage green": "#87A96B",
  "taupe suede": "#8B8589",
  "nero black": "#1C1C1C",
  silver: "#C0C0C0",
  "silver / tan leather": "#C0C0C0",
  "black pvd / mesh": "#232323",
  navy: "#1B2A4A",
  beige: "#F5F5DC",
  brown: "#8B4513",
  tan: "#D2B48C",
  sand: "#D8C2A7",
  olive: "#556B2F",
  "olive drab": "#556B2F",
  "oatmeal melange": "#DBCBB8",
  "sand suede": "#D8C2A7",
  "steel / horween leather": "#C0C0C0",
  cream: "#FFFDD0",
}

/**
 * Helper to determine if an option title represents a Color option (English or Persian).
 */
export const isColorTitle = (title?: string): boolean => {
  if (!title) return false
  const t = title.trim().toLowerCase()
  return t === "color" || t === "colors"
}

/**
 * Builds a Map of lowercase color name -> hex color code from product variants metadata (color_code)
 * with robust option_id matching and color dictionary fallback.
 */
export function buildColorCodeMap(
  product: HttpTypes.StoreProduct
): Map<string, string> {
  const map = new Map<string, string>()

  // 1. Identify which option ID represents Color
  const colorOptionId = product.options?.find((opt: any) =>
    isColorTitle(opt.title)
  )?.id

  // 2. Map all variant colors
  product.variants?.forEach((variant) => {
    const colorOpt = variant.options?.find(
      (opt: any) =>
        (colorOptionId && opt.option_id === colorOptionId) ||
        isColorTitle(opt.title) ||
        isColorTitle(opt.option?.title)
    )
    if (colorOpt?.value) {
      const rawValue = colorOpt.value.trim()
      const colorKey = rawValue.toLowerCase()
      const metadata = variant.metadata || (variant as any).user_metadata

      if (!map.has(colorKey)) {
        if (metadata?.color_code) {
          map.set(colorKey, metadata.color_code as string)
        } else if (COLOR_NAME_FALLBACKS[colorKey]) {
          map.set(colorKey, COLOR_NAME_FALLBACKS[colorKey])
        } else {
          // If the colorKey itself looks like a valid CSS hex or color (e.g. #fff, red)
          map.set(colorKey, colorKey)
        }
      }
    }
  })

  // 3. Also check product.options values if any remain unmapped
  if (product.options) {
    const colorOpt = product.options.find((opt) => isColorTitle(opt.title))
    colorOpt?.values?.forEach((val: any) => {
      const valStr = (val.value || val).toString().trim().toLowerCase()
      if (!map.has(valStr) && COLOR_NAME_FALLBACKS[valStr]) {
        map.set(valStr, COLOR_NAME_FALLBACKS[valStr])
      }
    })
  }

  return map
}

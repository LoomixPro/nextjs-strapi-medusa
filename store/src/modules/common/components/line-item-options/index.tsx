"use client"

import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useLocale } from "next-intl"

type ExtendedVariant = HttpTypes.StoreProductVariant & {
  translations?: Array<{
    locale_code?: string
    translations?: {
      title?: string
      [key: string]: any
    }
  }>
  metadata?: Record<string, any> | null
}

type LineItemOptionsProps = {
  variant: ExtendedVariant | undefined
  "data-testid"?: string
  "data-value"?: HttpTypes.StoreProductVariant
}

const LineItemOptions = ({
  variant,
  "data-testid": dataTestid,
  "data-value": dataValue,
}: LineItemOptionsProps) => {
  const currentLocale = useLocale()

  if (!variant) return null

  // 1. Check Medusa translations array for matching locale (e.g. en-US, en)
  const translation = variant.translations?.find((t) => {
    if (!t.locale_code) return false
    const loc = t.locale_code.toLowerCase()
    const cur = (currentLocale || "").toLowerCase()
    return loc === cur || loc.startsWith(cur) || cur.startsWith(loc)
  })

  // 2. Resolve title: Medusa translation -> metadata.title_en (if English) -> variant.title
  const title =
    translation?.translations?.title ||
    (currentLocale?.toLowerCase().startsWith("en")
      ? variant.metadata?.title_en || variant.metadata?.title
      : undefined) ||
    variant.title

  if (!title || title.toLowerCase().includes("default")) {
    return null
  }

  return (
    <Text
      data-testid={dataTestid}
      data-value={dataValue}
      dir="auto"
      className="txt-medium text-muted-foreground w-full overflow-hidden text-ellipsis font-medium"
    >
      <span dir="auto" className="unicode-bidi-isolate">
        {title}
      </span>
    </Text>
  )
}

export default LineItemOptions

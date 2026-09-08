"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import { useDictionary } from "@modules/common/components/dictionary-provider"
import { isColorTitle, buildColorCodeMap } from "@lib/util/product-colors"
import { cn } from "@lib/utils"

export interface ColorSwatchProps {
  colorHex: string
  colorName?: string
  isSelected?: boolean
  onClick?: (e?: React.MouseEvent) => void
  disabled?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  swatchClassName?: string
}

/**
 * Reusable individual Color Swatch button component supporting Light and Dark modes.
 * Allows custom className injection for flexible styling across pages and cards.
 */
export function ColorSwatch({
  colorHex,
  colorName,
  isSelected = false,
  onClick,
  disabled = false,
  size = "md",
  className,
  swatchClassName,
}: ColorSwatchProps) {
  const translate = useDictionary()

  const sizeClasses = {
    sm: "w-4 h-4 p-[1px] mx-[2px]",
    md: "w-7 h-7 p-0.5 mx-[2px]",
    lg: "w-9 h-9 p-0.5 mx-[2px]",
  }

  const isInteractive = !!onClick

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || (!isInteractive && !onClick)}
      title={colorName ? translate(colorName) || colorName : undefined}
      className={cn(
        "relative rounded-full border transition-all duration-200 flex items-center justify-center bg-background",
        "border-neutral-300 dark:border-neutral-600",
        sizeClasses[size] || "w-7 h-7 p-0.5",
        isInteractive ? "hover:scale-110 cursor-pointer" : "cursor-default",
        isSelected
          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110 shadow-md"
          : "hover:border-foreground/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "w-full h-full rounded-full border border-black/10 dark:border-white/20 shadow-inner block",
          swatchClassName
        )}
        style={{ backgroundColor: colorHex }}
      />
    </button>
  )
}

interface ProductColorsProps {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant | undefined
  onSelectVariant?: (variant: HttpTypes.StoreProductVariant) => void
  limit?: number
  size?: "sm" | "md" | "lg"
  className?: string
  showCount?: boolean
}

/**
 * Renders a list of unique Color Swatches for a Product (used in Product Cards & Lists).
 */
export default function ProductColors({
  product,
  selectedVariant,
  onSelectVariant,
  limit,
  size = "sm",
  className = "flex justify-center gap-1.5 flex-wrap min-h-[20px]",
  showCount = false,
}: ProductColorsProps) {
  // Build a color code map from all variants metadata using shared utility
  const colorCodeMap = buildColorCodeMap(product)

  // Extract color swatches handling both Meilisearch flattened options AND standard Medusa API options
  const uniqueColorsMap = new Map<string, any>()
  product.options?.forEach((opt: any) => {
    if (isColorTitle(opt.title)) {
      const values = opt.value ? [opt] : opt.values || []
      values.forEach((v: any) => {
        const colorValue = v.value
        if (colorValue && !uniqueColorsMap.has(colorValue)) {
          uniqueColorsMap.set(colorValue, {
            title: opt.title,
            value: colorValue,
          })
        }
      })
    }
  })

  const uniqueColors = Array.from(uniqueColorsMap.values())

  if (!uniqueColors || uniqueColors.length === 0) {
    return null
  }

  const displayedColors = limit ? uniqueColors.slice(0, limit) : uniqueColors

  return (
    <div className={className}>
      {displayedColors.map((colorOption: any, index: number) => {
        const colorName = colorOption?.value?.toLowerCase() || ""
        const colorHex = colorCodeMap.get(colorName) || colorName || "#ccc"

        const isSelected = selectedVariant?.options?.some(
          (opt: any) =>
            (isColorTitle(opt.title) || isColorTitle(opt.option?.title)) &&
            opt.value?.toLowerCase() === colorName
        )

        const isInteractive = !!onSelectVariant

        return (
          <ColorSwatch
            key={index}
            colorHex={colorHex}
            colorName={colorOption?.value}
            isSelected={isSelected}
            size={size}
            onClick={
              isInteractive
                ? (e) => {
                    e?.preventDefault()
                    const matchingVariant = product.variants?.find((v) => {
                      return v.options?.some(
                        (opt: any) =>
                          (isColorTitle(opt.title) ||
                            isColorTitle(opt.option?.title)) &&
                          opt.value?.toLowerCase() === colorName
                      )
                    })
                    if (matchingVariant) onSelectVariant(matchingVariant)
                  }
                : undefined
            }
          />
        )
      })}
      {showCount && uniqueColors.length > limit! && (
        <span className="text-[10px] text-muted-foreground flex items-center ml-1">
          +{uniqueColors.length - limit!}
        </span>
      )}
    </div>
  )
}

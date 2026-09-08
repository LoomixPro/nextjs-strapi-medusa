"use client"

import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import { useProductActions } from "@lib/hooks/use-product-actions"
import { Loader2, Plus, Minus } from "lucide-react"
import ProductPrice from "@modules/products/components/product-price"
import { Button } from "@modules/common/components/shadcn/button"
import { cn } from "@lib/utils"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useDictionary } from "@modules/common/components/dictionary-provider"

import { ColorSwatch } from "@modules/products/components/product-colors"

interface ProductActionsV2Props {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

export default function ProductActionsV2({
  product,
  disabled,
}: ProductActionsV2Props) {
  const {
    options,
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
  } = useProductActions({ product, disabled })
  const t = useTranslations("Product.actions")
  const translate = useDictionary()

  return (
    <div className="flex flex-col gap-6">
      {/* Color Selection (Swatches Style) */}
      {colorOption && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-ui-fg-muted">
            {translate(colorOption.title)}:{" "}
            <span className="text-ui-fg-base">
              {translate(options[colorOption.id]) || t("select_color")}
            </span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {colorOption.values?.map((v) => {
              const colorValue = v.value.toLowerCase()
              const colorHex = colorCodeMap.get(colorValue) ?? colorValue

              return (
                <ColorSwatch
                  key={v.id}
                  colorHex={colorHex}
                  colorName={v.value}
                  isSelected={options[colorOption.id] === v.value}
                  onClick={() => handleColorChange(v.value || "")}
                  disabled={(disabled ?? false) || isAdding}
                  size="md"
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Dynamic Non-Color Options (Size, Material, Style, etc.) */}
      {nonColorOptions.map((option) => (
        <div key={option.id} className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-ui-fg-muted">
            {translate(option.title)}
          </p>
          <div className="flex flex-wrap gap-2">
            {option.values?.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setOptionValue(option.id, v.value)}
                disabled={(disabled ?? false) || isAdding}
                className={cn(
                  "h-10 min-w-10 px-3 flex items-center justify-center rounded-md border text-xs font-medium transition-all uppercase",
                  options[option.id] === v.value
                    ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black font-bold"
                    : "border-ui-border-base bg-ui-bg-base text-ui-fg-base hover:border-ui-border-interactive hover:bg-ui-bg-subtle",
                  ((disabled ?? false) || isAdding) &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                {translate(v.value)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("quantity")}
        </p>
        <div className="flex items-center justify-between w-32 bg-muted/50 border border-border/50 rounded-full h-12 p-1">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-95"
            disabled={quantity <= 1 || (disabled ?? false) || isAdding}
          >
            <Minus size={14} />
          </button>
          <span className="flex-1 text-center text-sm font-bold tabular-nums text-foreground">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
            className="w-10 h-10 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-95"
            disabled={quantity >= maxStock || (disabled ?? false) || isAdding}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="pt-2">
        <ProductPrice product={product} variant={selectedVariant} />
        {selectedVariant && !inStock && (
          <p className="text-[10px] text-red-500 mt-1 font-bold">
            {t("out_of_stock")}
          </p>
        )}
      </div>

      {/* Add To Cart + Wishlist */}
      <div className="flex gap-3">
        <Button
          onClick={() => {
            void handleAddToCart()
          }}
          disabled={
            !inStock ||
            !selectedVariant ||
            (disabled ?? false) ||
            isAdding ||
            !isValidVariant
          }
          className="flex-1 h-11 transition-all font-bold text-sm rounded-xl uppercase tracking-widest"
          data-testid="add-product-button"
        >
          {isAdding ? (
            <Loader2 className="animate-spin mr-2" size={16} />
          ) : null}
          {!selectedVariant && (colorOption || nonColorOptions.length > 0)
            ? t("select_options")
            : !inStock || !isValidVariant
              ? t("out_of_stock")
              : t("add_to_bag")}
        </Button>
        <WishlistButton variantId={selectedVariant?.id} />
      </div>
    </div>
  )
}

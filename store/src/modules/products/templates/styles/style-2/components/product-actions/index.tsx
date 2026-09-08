"use client"

import { Loader2, Plus, Minus } from "lucide-react"
import { useProductActions } from "@lib/hooks/use-product-actions"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"
import { Button } from "@modules/common/components/shadcn/button"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useDictionary } from "@modules/common/components/dictionary-provider"

import { ColorSwatch } from "@modules/products/components/product-colors"

interface ProductActionsStyle2Props {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

export default function ProductActionsStyle2({
  product,
  disabled,
}: ProductActionsStyle2Props) {
  const t = useTranslations("Product.actions")
  const translate = useDictionary()
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

  return (
    <div className="flex flex-col gap-6">
      {/* Colors */}
      {colorOption && (
        <div className="space-y-4">
          <h4 className="font-bold text-sm text-foreground">
            {translate(colorOption.title || t("color"))}:{" "}
            <span className="font-normal text-muted-foreground">
              {translate(options[colorOption.id])}
            </span>
          </h4>
          <div className="flex gap-2">
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
                  size="lg"
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Dynamic Non-Color Options (Size, Material, Style, etc.) */}
      {nonColorOptions.map((option) => (
        <div key={option.id} className="space-y-4">
          <h4 className="font-bold text-sm text-foreground">
            {translate(option.title)}
          </h4>
          <div className="flex gap-2 flex-wrap">
            {option.values?.map((v) => (
              <button
                key={v.id}
                onClick={() => setOptionValue(option.id, v.value || "")}
                className={cn(
                  "px-4 py-2 border rounded-full text-sm font-bold transition-all uppercase",
                  options[option.id] === v.value
                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                    : "bg-background text-foreground border-border hover:bg-muted"
                )}
              >
                {translate(v.value)}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Quantity and Add to Cart */}
      <div className="flex gap-4 items-end pt-6">
        <div className="w-1/3 min-w-[120px]">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
            {t("quantity")}
          </label>
          <div className="flex items-center justify-between w-full bg-muted/50 border border-border/50 rounded-full h-12 p-1">
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
          className="flex-1 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-widest uppercase transition-transform hover:scale-[1.02] active:scale-95 shadow-lg h-12 mt-[26px]"
          data-testid="add-product-button"
        >
          {isAdding ? (
            <Loader2 className="animate-spin mr-2" size={20} />
          ) : null}
          {!inStock ? t("out_of_stock") : t("add_to_cart")}
        </Button>
        <WishlistButton
          variantId={selectedVariant?.id}
          className="h-12 w-12 rounded-full mt-[26px]"
        />
      </div>
      {!inStock && selectedVariant && (
        <p className="text-xs text-red-500 font-medium">
          {t("variant_out_of_stock")}
        </p>
      )}
    </div>
  )
}

"use client"

import { Loader2, Plus, Minus, ArrowLeft } from "lucide-react"
import { useProductActions } from "@lib/hooks/use-product-actions"
import { HttpTypes } from "@medusajs/types"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"
import { Button } from "@modules/common/components/shadcn/button"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useDictionary } from "@modules/common/components/dictionary-provider"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
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

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Colors (Desktop only, since on mobile it is placed directly under the photo) ── */}
      {colorOption && (
        <div className="hidden md:block space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-muted-foreground">
              {translate(colorOption.title || t("color"))}:{" "}
              <span className="text-foreground font-semibold">
                {translate(options[colorOption.id]) || t("select_color")}
              </span>
            </span>
          </div>

          <div className="inline-flex items-center justify-start gap-2.5 p-2 rounded-2xl bg-neutral-900/90 dark:bg-neutral-900/90 border border-white/10 shadow-xl backdrop-blur-xl max-w-full overflow-x-auto scrollbar-none">
            {colorOption.values?.map((v) => {
              const colorValue = v.value.toLowerCase()
              const colorHex = colorCodeMap.get(colorValue) ?? colorValue
              const isSelected = options[colorOption.id] === v.value
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleColorChange(v.value || "")}
                  disabled={(disabled ?? false) || isAdding}
                  className={cn(
                    "w-11 h-11 rounded-xl transition-all duration-200 relative cursor-pointer shrink-0 flex items-center justify-center",
                    "border border-white/15 shadow-sm",
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-105 shadow-md"
                      : "hover:scale-105 opacity-85 hover:opacity-100",
                    ((disabled ?? false) || isAdding) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                  style={{ backgroundColor: colorHex }}
                  title={v.value}
                  aria-label={v.value}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── Dynamic Non-Color Options (Size, Material, Style, etc.) ── */}
      {nonColorOptions.map((option) => (
        <div key={option.id} className="space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
            {translate(option.title)}
          </h4>
          <div className="flex gap-2 flex-wrap">
            {option.values?.map((v) => (
              <button
                key={v.id}
                onClick={() => setOptionValue(option.id, v.value || "")}
                className={cn(
                  "px-4 py-2 border rounded-full text-xs sm:text-sm font-bold transition-all uppercase",
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

      {/* ── Mobile In-Page Quantity Selector ── */}
      <div className="md:hidden space-y-2 pt-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block">
          {t("quantity")}
        </label>
        <div className="flex items-center justify-between w-32 bg-muted/50 border border-border/50 rounded-full h-11 p-1">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-95"
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
            className="w-9 h-9 flex items-center justify-center rounded-full text-foreground hover:bg-background hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none active:scale-95"
            disabled={quantity >= maxStock || (disabled ?? false) || isAdding}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* ── Desktop Quantity and Add to Cart Row (Hidden on mobile) ── */}
      <div className="hidden md:flex flex-row gap-4 items-end pt-4">
        <div className="w-auto">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 block">
            {t("quantity")}
          </label>
          <div className="flex items-center justify-between w-36 bg-muted/50 border border-border/50 rounded-full h-12 p-1">
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

        <div className="flex items-center gap-3 flex-1 w-full">
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
            className="flex-1 h-12 px-6 rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-wider uppercase transition-transform hover:scale-[1.02] active:scale-95 shadow-lg whitespace-nowrap"
            data-testid="add-product-button"
          >
            {isAdding ? (
              <Loader2 className="animate-spin mr-2 shrink-0" size={18} />
            ) : null}
            <span className="truncate">
              {!inStock ? t("out_of_stock") : t("add_to_cart")}
            </span>
          </Button>
          <WishlistButton
            variantId={selectedVariant?.id}
            className="h-12 w-12 rounded-full shrink-0"
          />
        </div>
      </div>

      {!inStock && selectedVariant && (
        <p className="text-xs text-red-500 font-medium">
          {t("variant_out_of_stock")}
        </p>
      )}

      {/* ── Mobile Sticky Bottom Bar (Replaces BottomNavBar with Add to Bag & Minimal Back Button) ── */}
      <div
        suppressHydrationWarning
        className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-background/85 dark:bg-neutral-950/85 backdrop-blur-2xl border-t border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.2)] md:hidden"
      >
        <div className="flex items-center gap-3 max-w-md mx-auto">
          {/* Minimal Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="w-12 h-12 rounded-full border border-border/60 bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
          </button>

          {/* Add to Bag / Add to Cart Pill Button */}
          <Button
            type="button"
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
            className="flex-1 h-12 rounded-full bg-primary text-primary-foreground font-bold text-sm tracking-wide uppercase shadow-lg active:scale-95 transition-all cursor-pointer"
            data-testid="mobile-sticky-add-button"
          >
            {isAdding ? (
              <Loader2 className="animate-spin mr-2 shrink-0" size={18} />
            ) : null}
            <span className="truncate">
              {!inStock ? t("out_of_stock") : t("add_to_cart")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  )
}

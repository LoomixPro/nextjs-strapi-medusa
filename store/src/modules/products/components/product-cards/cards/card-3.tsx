"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import { getProductReviews } from "@lib/data/products"
import { getActiveSettings } from "@lib/util/storefront-settings"
import { getNonColorOptions } from "@lib/util/product"
import { useTranslations, useLocale } from "next-intl"
import { useDictionary } from "@modules/common/components/dictionary-provider"
import { Star, Sparkles } from "lucide-react"
import ProductColors from "@modules/products/components/product-colors"
import WishlistButton from "@modules/products/components/wishlist-button"
import { useIntersection } from "@lib/hooks/use-in-view"
import React from "react"
import { ProductReviewSummary } from "@/types/global"

interface ProductCard3Props {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  reviewSummary?: ProductReviewSummary | null
}

export default function ProductCard3({
  product,
  reviewSummary,
}: ProductCard3Props) {
  const t = useTranslations("Store.sort_bar")
  const translate = useDictionary()
  const locale = useLocale()
  const settings = getActiveSettings()

  const [selectedVariant, setSelectedVariant] = useState<
    HttpTypes.StoreProductVariant | undefined
  >(product.variants?.[0])
  const [rating, setRating] = useState<number | null>(() =>
    reviewSummary && reviewSummary.averageRating > 0
      ? reviewSummary.averageRating
      : null
  )
  const [reviewsCount, setReviewsCount] = useState<number>(
    reviewSummary?.count ?? 0
  )

  const cardRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(cardRef, "200px")
  const [reviewsFetched, setReviewsFetched] = useState(
    reviewSummary !== undefined
  )

  useEffect(() => {
    if (
      !isVisible ||
      reviewsFetched ||
      reviewSummary !== undefined ||
      !product.id
    ) {
      return
    }

    setReviewsFetched(true)
    getProductReviews({ productId: product.id, limit: 1 })
      .then((data) => {
        if (data && data.average_rating > 0) {
          setRating(data.average_rating)
          setReviewsCount(data.count ?? 0)
        }
      })
      .catch(() => {})
  }, [isVisible, reviewsFetched, reviewSummary, product.id])

  // Images
  const primaryImage =
    selectedVariant?.thumbnail ||
    selectedVariant?.images?.[0]?.url ||
    product.thumbnail ||
    product.images?.[0]?.url ||
    "/placeholder.png"

  const secondaryImage =
    product.images?.[1]?.url || product.images?.[0]?.url || primaryImage

  const hasSecondaryImage = secondaryImage !== primaryImage

  // Price Calculation
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
    locale,
    settings,
  })

  const priceInfo = variantPrice || cheapestPrice

  const discountPercentage = priceInfo?.percentage_diff
    ? Math.abs(Math.round(Number(priceInfo.percentage_diff)))
    : 0

  // Extract all unique non-color options for display (e.g., Size, Material, etc.)
  const otherOptions = getNonColorOptions(product.options)

  const activeVariantId = selectedVariant?.id || product.variants?.[0]?.id

  return (
    <div
      ref={cardRef}
      className="group relative w-full flex flex-col rounded-3xl bg-card border border-border/60 dark:border-border/30 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 hover:-translate-y-1.5"
    >
      {/* TOP IMAGE STAGE */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-zinc-900">
        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-lg shadow-rose-500/25 tracking-wide">
            <Sparkles className="w-3 h-3 animate-spin-slow" />
            <span>{t("off", { percentage: discountPercentage })}</span>
          </div>
        )}

        {/* Real Medusa Wishlist Button */}
        <div className="absolute top-3.5 right-3.5 z-20">
          <WishlistButton
            variantId={activeVariantId}
            className="w-9 h-9 !rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-border/50 shadow-md hover:scale-110 transition-all duration-300 flex items-center justify-center"
          />
        </div>

        {/* Image Display with Smooth Crossfade */}
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="block w-full h-full relative"
          draggable={false}
        >
          <Image
            src={primaryImage}
            alt={product.title || "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 350px"
            className={`object-cover p-2 transition-all duration-700 ease-out group-hover:scale-105 ${
              hasSecondaryImage ? "group-hover:opacity-0" : ""
            }`}
            loading="lazy"
            draggable={false}
          />
          {hasSecondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.title} alternative`}
              fill
              sizes="(max-width: 768px) 100vw, 350px"
              className="object-cover p-2 opacity-0 transition-all duration-700 ease-out group-hover:opacity-100 group-hover:scale-105"
              loading="lazy"
              draggable={false}
            />
          )}
        </LocalizedClientLink>
      </div>

      {/* CONTENT BODY */}
      <div className="p-4 flex flex-col gap-2.5">
        {/* Collection / Subtitle & Rating */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary/80">
            {product.collection?.title
              ? translate(product.collection.title)
              : t("newest")}
          </span>

          {rating !== null && rating > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/10 dark:bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{rating.toFixed(1)}</span>
              {reviewsCount > 0 && (
                <span className="text-muted-foreground/70 font-normal">
                  ({reviewsCount})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
          title={product.title}
        >
          {product.title}
        </LocalizedClientLink>

        {/* Price Tag Box & Color Swatches */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold text-foreground tracking-tight">
              {priceInfo ? priceInfo.calculated_price : "N/A"}
            </span>

            {priceInfo?.price_type === "sale" && (
              <span className="line-through text-muted-foreground text-xs font-medium">
                {priceInfo.original_price}
              </span>
            )}
          </div>

          {/* Color Swatches with Small Gap */}
          <ProductColors
            product={product}
            selectedVariant={selectedVariant}
            onSelectVariant={setSelectedVariant}
            limit={4}
            size="sm"
            className="flex items-center gap-1 flex-wrap justify-end"
          />
        </div>

        {/* Quick Sizes / Other Variant Options */}
        {otherOptions && otherOptions.length > 0 && (
          <div className="pt-2 border-t border-border/40 space-y-1.5">
            {otherOptions.map((option) => (
              <div
                key={option.name}
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
              >
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                  {translate(option.name)}:
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {option.values.slice(0, 6).map((val: string) => (
                    <span
                      key={val}
                      className="px-2 py-0.5 rounded-md bg-muted/60 dark:bg-zinc-800/60 border border-border/40 text-[10px] font-semibold text-foreground/80 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-all cursor-pointer"
                    >
                      {translate(val)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

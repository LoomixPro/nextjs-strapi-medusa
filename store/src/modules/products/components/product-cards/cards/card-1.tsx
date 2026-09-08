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
import { Eye, Flame, Star } from "lucide-react"
import ProductColors from "@modules/products/components/product-colors"
import { GlowCard } from "@modules/common/components/glow-card"
import { useIntersection } from "@lib/hooks/use-in-view"
import React from "react"
import { ProductReviewSummary } from "@/types/global"

interface ProductCard1Props {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  reviewSummary?: ProductReviewSummary | null
}

export default function ProductCard1({
  product,
  reviewSummary,
}: ProductCard1Props) {
  const t = useTranslations("Product.cards")
  const tPrice = useTranslations("Product.price")
  const tInfo = useTranslations("Product.info")
  const translate = useDictionary()
  const [selectedVariant, setSelectedVariant] = useState<
    HttpTypes.StoreProductVariant | undefined
  >(product.variants?.[0])
  const [views, setViews] = useState<number | null>(null)
  const [rating, setRating] = useState<number | null>(() =>
    reviewSummary && reviewSummary.averageRating > 0
      ? reviewSummary.averageRating
      : null
  )
  const [isBadgeHovered, setIsBadgeHovered] = useState(false)

  const cardRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useIntersection(cardRef, "200px")
  const [viewsFetched, setViewsFetched] = useState(false)
  const [reviewsFetched, setReviewsFetched] = useState(
    reviewSummary !== undefined
  )

  useEffect(() => {
    if (!isVisible || !product.handle) return

    if (!viewsFetched) {
      setViewsFetched(true)

      fetch(`/api/views?handle=${product.handle}`)
        .then((res) => res.json())
        .then((data) => setViews(data.views ?? 0))
        .catch((err) => console.error("Error fetching views:", err))
    }

    if (reviewsFetched || reviewSummary !== undefined || !product.id) {
      return
    }

    setReviewsFetched(true)

    getProductReviews({ productId: product.id, limit: 1 })
      .then((data) => {
        if (data && data.average_rating > 0) {
          setRating(data.average_rating)
        }
      })
      .catch((err) => console.error("Error fetching rating:", err))
  }, [
    isVisible,
    viewsFetched,
    reviewsFetched,
    reviewSummary,
    product.handle,
    product.id,
  ])

  // Get main image - use variant thumbnail, variant's first image, or product thumbnail
  const mainImageUrl =
    selectedVariant?.thumbnail ||
    selectedVariant?.images?.[0]?.url ||
    product.thumbnail ||
    product.images?.[0]?.url ||
    "/placeholder.png"

  const locale = useLocale()
  const settings = getActiveSettings()
  // Get price info using Medusa's utility function
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: selectedVariant?.id,
    locale,
    settings,
  })

  const hasRating = rating !== null

  const priceInfo = variantPrice || cheapestPrice

  const isPriceRange =
    !selectedVariant &&
    product.variants?.some(
      (v: any) =>
        v.calculated_price &&
        cheapestPrice &&
        v.calculated_price.calculated_amount >
          cheapestPrice.calculated_price_number
    )

  const discountPercentage = priceInfo?.percentage_diff
    ? Math.abs(Math.round(Number(priceInfo.percentage_diff)))
    : 0

  // Extract all unique non-color options for display (e.g., Size, Material, etc.)
  const otherOptions = getNonColorOptions(product.options)

  return (
    <GlowCard
      customSize={true}
      glowColor="blue"
      className="group w-full bg-background"
    >
      {/* IMAGE */}
      <div
        ref={cardRef}
        className="relative w-full aspect-square overflow-hidden bg-muted rounded-t-2xl"
      >
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-lg transform -rotate-2">
            {t("off", { percentage: discountPercentage })}
          </div>
        )}

        {hasRating && (
          <div className="absolute top-3 right-3 z-20 bg-background/80 backdrop-blur-md border border-border shadow-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-semibold text-foreground hover:border-primary/50 hover:text-primary transition-all duration-300">
            <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
            <span>{Number(rating).toFixed(1)}</span>
          </div>
        )}

        {/* Umami Views Count Badge */}
        {views === null ? (
          <div className="absolute bottom-3 right-3 z-20 bg-background/70 backdrop-blur-md border border-border text-muted-foreground text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
            <Eye className="w-3.5 h-3.5 text-muted-foreground/50" />
            <div className="w-6 h-2 bg-muted rounded-sm animate-pulse"></div>
          </div>
        ) : (
          views > 0 && (
            <div
              className="absolute bottom-3 right-3 z-20 cursor-default"
              onMouseEnter={() => setIsBadgeHovered(true)}
              onMouseLeave={() => setIsBadgeHovered(false)}
            >
              <div
                className={`backdrop-blur-md border shadow-sm px-2.5 py-1 rounded-full flex items-center gap-1.5 text-[10px] font-semibold transition-all duration-300 ${
                  views >= 50
                    ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/20"
                    : "bg-background/80 border-border text-foreground hover:border-primary/50 hover:text-primary"
                } ${isBadgeHovered ? "scale-105 shadow-md" : ""}`}
              >
                {views >= 50 ? (
                  <Flame
                    className={`w-3.5 h-3.5 text-amber-500 fill-amber-500 ${
                      isBadgeHovered ? "animate-bounce" : "animate-pulse"
                    }`}
                  />
                ) : (
                  <Eye
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
                      isBadgeHovered ? "scale-110 text-primary" : ""
                    }`}
                  />
                )}
                <span>{views.toLocaleString()}</span>
              </div>
              <div
                className={`absolute bottom-full right-1/2 translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-[9px] font-medium rounded-md shadow-lg border border-border transition-all duration-200 whitespace-nowrap z-30 ${
                  isBadgeHovered
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-1 pointer-events-none"
                }`}
              >
                {views >= 50 ? tInfo("popular_product") : tInfo("views_count")}
              </div>
            </div>
          )
        )}

        <LocalizedClientLink
          href={`/products/${product.handle}`}
          className="block w-full h-full relative"
          draggable={false}
        >
          <Image
            src={mainImageUrl}
            alt={product.title || t("product_alt")}
            fill
            sizes="(max-width: 600px) 100vw, 350px"
            className="object-contain transition-transform duration-500"
            loading="lazy"
            draggable={false}
          />
        </LocalizedClientLink>
      </div>

      {/* BODY */}
      <div className="p-3 flex flex-col gap-1.5">
        <div className="flex flex-col gap-0.5 items-center text-center">
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
            title={product.title}
          >
            {product.title}
          </LocalizedClientLink>

          {/* Price - Minimal display */}
          <div className="flex justify-center items-center gap-1.5">
            {priceInfo?.price_type === "sale" && (
              <span className="line-through text-muted-foreground text-xs">
                {priceInfo.original_price}
              </span>
            )}
            <span
              className={`text-sm font-semibold ${
                priceInfo?.price_type === "sale"
                  ? "text-red-500"
                  : "text-foreground"
              }`}
            >
              {isPriceRange ? tPrice("from") : ""}
              {priceInfo ? priceInfo.calculated_price : "N/A"}
            </span>
          </div>
        </div>

        {/* Color Swatches - Minimal */}
        <ProductColors
          product={product}
          selectedVariant={selectedVariant}
          onSelectVariant={setSelectedVariant}
          limit={5}
          size="sm"
          className="flex justify-center gap-1.5 pt-1.5 flex-wrap min-h-[20px]"
        />

        {/* Other Variant Options */}
        {otherOptions && otherOptions.length > 0 && (
          <div className="mt-2 pt-2.5 border-t border-border/20 space-y-1.5">
            {otherOptions.map((option) => (
              <div key={option.name} className="space-y-1">
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/70 font-bold text-center">
                  {translate(option.name)}
                </p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {option.values.map((value) => (
                    <span
                      key={value}
                      className="
                        inline-flex items-center px-2.5 py-[3px]
                        text-[10px] font-semibold tracking-wide uppercase
                        rounded-full
                        bg-gradient-to-br from-muted/70 to-muted/30
                        border border-border/40
                        text-foreground/90
                        backdrop-blur-sm
                        shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
                        transition-all duration-200
                        hover:border-primary/40
                        hover:text-foreground
                        hover:shadow-[0_0_8px_rgba(var(--primary-rgb,99,102,241),0.15)]
                        hover:scale-[1.04]
                        cursor-default
                      "
                    >
                      {translate(value)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GlowCard>
  )
}

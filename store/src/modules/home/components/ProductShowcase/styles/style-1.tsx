"use client"

import React, { useRef, useState, useEffect } from "react"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@modules/products/components/product-cards"
import { Flame, Percent, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { getProductPrice } from "@lib/util/get-product-price"
import { useTranslations, useLocale } from "next-intl"
import { getActiveSettings } from "@lib/util/storefront-settings"
import BlockHeader from "@modules/common/components/block-header"

function ProductShowcaseCard({ product }: { product: any }) {
  const [isHovered, setIsHovered] = useState(false)
  const t = useTranslations("HomePage")
  const locale = useLocale()
  const settings = getActiveSettings()

  let priceInfo: any = null
  if (product?.variants?.length) {
    try {
      const { cheapestPrice } = getProductPrice({ product, locale, settings })
      priceInfo = cheapestPrice
    } catch (e) {
      console.error("Error getting product price:", e)
    }
  }

  const productTitle = product.title
  const handle = product.handle
  const thumbnail =
    product.thumbnail ||
    product.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop"
  const category =
    product.category ||
    product.categories?.[0]?.name ||
    t("showcase.default_category")

  const priceText = priceInfo
    ? priceInfo.calculated_price
    : product.price
      ? `${product.price}`
      : ""
  const originalPriceText = priceInfo?.original_price || product.originalPrice
  const isSale = priceInfo
    ? priceInfo.price_type === "sale"
    : !!product.originalPrice

  const rawDiscount = priceInfo?.percentage_diff || product.discount
  const discount =
    rawDiscount &&
    rawDiscount !== "0" &&
    rawDiscount !== "0%" &&
    rawDiscount !== 0
      ? String(rawDiscount).endsWith("%")
        ? rawDiscount
        : `${rawDiscount}%`
      : null

  return (
    <LocalizedClientLink
      href={`/products/${handle}`}
      draggable={false}
      className="relative group snap-center flex-shrink-0 w-[200px] sm:w-[260px] md:w-[320px] h-[320px] sm:h-[380px] md:h-[440px] rounded-[2rem] overflow-hidden cursor-pointer bg-background/5 border border-border/40 hover:border-primary/30 transition-all duration-700 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] shadow-[0_4px_20px_-8px_rgba(0,0,0,0.05)] block select-none touch-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 z-0 bg-muted/10 rounded-[inherit] overflow-hidden [transform:translateZ(0)]">
        <Image
          src={thumbnail}
          alt={productTitle}
          fill
          draggable={false}
          className={`object-cover transition-transform duration-1000 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
          sizes="(max-width: 640px) 200px, (max-width: 768px) 260px, 320px"
        />
      </div>

      {/* Elegant dark overlay */}
      <div
        className={`absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/30 to-transparent transition-opacity duration-700 rounded-[inherit] ${
          isHovered ? "opacity-95" : "opacity-80"
        }`}
      ></div>

      {/* Promo / Discount Badge */}
      {discount && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full uppercase tracking-widest shadow-md border border-white/10 select-none">
          {t("showcase.discount_badge", { discount })}
        </div>
      )}

      {/* Card Content */}
      <div className="absolute bottom-0 left-0 w-full p-4 sm:p-5 md:p-7 z-20 flex flex-col justify-end transform transition-transform duration-500 ease-out">
        <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white/60 mb-1 sm:mb-1.5 block font-bold">
          {category}
        </span>
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-1.5 sm:mb-2.5 line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-300">
          {productTitle}
        </h3>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-base md:text-lg font-bold text-white tracking-wide">
            {priceText}
          </span>
          {isSale && originalPriceText && (
            <span className="text-[10px] sm:text-xs md:text-sm text-white/40 line-through tracking-wide">
              {originalPriceText
                ? originalPriceText.startsWith("$")
                  ? originalPriceText
                  : `${originalPriceText}`
                : ""}
            </span>
          )}
        </div>

        {/* Action Button - Always visible on mobile, hover on desktop */}
        <div className="overflow-hidden transition-all duration-500 ease-in-out mt-3 sm:mt-4 rounded-xl max-h-10 opacity-100 md:max-h-0 md:opacity-0 group-hover:md:max-h-12 group-hover:md:opacity-100">
          <div className="flex items-center justify-center w-full bg-white/20 hover:bg-white/30 border border-white/20 text-white text-[9px] sm:text-[11px] tracking-widest font-bold py-2.5 sm:py-3 rounded-xl transition-all duration-300 active:scale-[0.98]">
            {t("showcase.quick_view")}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

/**
 * Guide for creating a new Product Showcase Block style
 *
 * This component acts as a UI block to display a curated collection of products,
 * often featuring a timer, promo code, or specific theme (e.g., trending, discount).
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props - `ProductShowcaseProps`):
 *    - `title`, `subtitle`, `description`: Textual headers for the block.
 *    - `type`: Defines the context (e.g., "trending", "discount", "campaign"). You can
 *      use this to alter icons, colors, or layouts dynamically.
 *    - `products`: An array of product objects (`HttpTypes.StoreProduct[]`) to be displayed.
 *    - `endsAt`: Optional date string. Use this to render a countdown timer for time-limited campaigns.
 *    - `promoCode`: Optional string. Display this prominently if a discount code is provided.
 *
 * 2. Component Structure & State:
 *    - Navigation: Implements manual scroll handling (`scrollRef`) or carousel controls.
 *    - Timer: Implements a `setInterval` hook to calculate remaining days, hours, and minutes
 *      if `endsAt` is provided.
 *
 * 3. Product Cards (`ProductShowcaseCard`):
 *    - This file includes a local `ProductShowcaseCard` component for rendering individual
 *      product items within the showcase. You can customize this card, adjust hover states,
 *      and format price displays (using `getProductPrice`).
 *
 * 4. Final Output (Return):
 *    Your component should return a responsive JSX wrapper containing the header, optional
 *    countdown/promo elements, and a scrollable/grid container for the product cards.
 */
export default function Style1({
  title,
  badge,
  description,
  type = "trending",
  products = [],
  region,
  cardStyle = "card-1",
  headerStyle,
  endsAt,
  promoCode,
  campaignId,
}: ProductShowcaseProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("HomePage")
  const [activeDot, setActiveDot] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [hasDragged, setHasDragged] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScrollEvent = () => {
      const scrollLeft = Math.abs(container.scrollLeft)
      const firstCard = container.querySelector(".group") as HTMLElement
      if (!firstCard) return

      const cardWidth = firstCard.getBoundingClientRect().width
      const gap = 16
      const index = Math.round(scrollLeft / (cardWidth + gap))
      setActiveDot(Math.min(products.length - 1, Math.max(0, index)))
    }

    container.addEventListener("scroll", handleScrollEvent, { passive: true })
    return () => container.removeEventListener("scroll", handleScrollEvent)
  }, [products])

  useEffect(() => {
    if (!endsAt) return

    const targetDate = new Date(endsAt).getTime()
    const updateTimer = () => {
      const difference = targetDate - new Date().getTime()
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return false
      }
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      })
      return true
    }

    updateTimer()
    const interval = setInterval(() => {
      const running = updateTimer()
      if (!running) clearInterval(interval)
    }, 1000)

    return () => clearInterval(interval)
  }, [endsAt])

  const showNavigation = products.length > 3

  const getIcon = () => {
    switch (type) {
      case "discount":
        return <Percent className="w-4 h-4 text-red-500" />
      case "campaign":
        return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
      case "trending":
      default:
        return <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
    }
  }

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollRef.current
    if (!container) return
    const scrollAmount = direction === "left" ? -340 : 340
    container.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return
    setIsDragging(true)
    setHasDragged(false)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeftState(scrollRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 2
    if (Math.abs(walk) > 10) {
      setHasDragged(true)
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDragged) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div className="relative w-full overflow-hidden bg-transparent">
      {/* BlockHeader: title + badge + link */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <BlockHeader
          title={title || t("showcase.featured_products")}
          badge={
            badge ||
            (type === "discount"
              ? t("showcase.special_offers")
              : type === "campaign"
                ? t("showcase.exclusive_campaign")
                : t("showcase.most_visited"))
          }
          description={description}
          linkText={t("view_all")}
          linkHref={campaignId ? `/store?campaign_id=${campaignId}` : "/store"}
          style={headerStyle}
        />

        {/* Extra controls: promo code, countdown, and scroll navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 -mt-6 mb-8">
          {/* Left side: promo code + countdown */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {promoCode && (
              <div className="flex items-center gap-2 sm:gap-3 bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.08)] select-all transition-all duration-300 hover:border-red-500/50">
                <span className="text-[9px] sm:text-[10px] md:text-xs font-black text-red-500 tracking-wide uppercase select-none">
                  {t("promo_code_label")}
                </span>
                <div className="h-3 sm:h-4 w-[1px] bg-red-500/30"></div>
                <span className="font-mono text-[10px] sm:text-xs md:text-sm font-black tracking-wider text-red-500 bg-red-500/10 px-2 sm:px-2.5 py-0.5 rounded-lg border border-red-500/10">
                  {promoCode}
                </span>
              </div>
            )}

            {endsAt && timeLeft && (
              <div
                className="flex items-center gap-2 sm:gap-3 bg-muted/40 backdrop-blur-sm border border-border/40 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-sm select-none"
                dir="ltr"
              >
                <div className="flex flex-col items-center min-w-[24px] sm:min-w-[32px]">
                  <span className="text-xs sm:text-sm md:text-base font-black text-foreground tabular-nums">
                    {timeLeft.days}
                  </span>
                  <span className="text-[7px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {t("days")}
                  </span>
                </div>
                <span className="text-muted-foreground/30 text-xs sm:text-sm font-black -translate-y-1 select-none">
                  :
                </span>
                <div className="flex flex-col items-center min-w-[24px] sm:min-w-[32px]">
                  <span className="text-xs sm:text-sm md:text-base font-black text-foreground tabular-nums">
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span className="text-[7px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {t("hours")}
                  </span>
                </div>
                <span className="text-muted-foreground/30 text-xs sm:text-sm font-black -translate-y-1 select-none">
                  :
                </span>
                <div className="flex flex-col items-center min-w-[24px] sm:min-w-[32px]">
                  <span className="text-xs sm:text-sm md:text-base font-black text-foreground tabular-nums">
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span className="text-[7px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {t("minutes")}
                  </span>
                </div>
                <span className="text-muted-foreground/30 text-xs sm:text-sm font-black -translate-y-1 select-none">
                  :
                </span>
                <div className="flex flex-col items-center min-w-[24px] sm:min-w-[32px]">
                  <span className="text-xs sm:text-sm md:text-base font-black text-foreground tabular-nums text-red-500">
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                  <span className="text-[7px] sm:text-[9px] uppercase tracking-wider text-red-500/80 font-semibold">
                    {t("seconds")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right side: Scroll navigation arrows */}
          {showNavigation && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => handleScroll("left")}
                className="bg-background/65 hover:bg-foreground/5 active:scale-95 border border-border/40 backdrop-blur-md text-foreground rounded-full p-1.5 sm:p-2.5 shadow-sm hover:shadow transition-all duration-300"
                aria-label={t("showcase.scroll_left")}
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => handleScroll("right")}
                className="bg-background/65 hover:bg-foreground/5 active:scale-95 border border-border/40 backdrop-blur-md text-foreground rounded-full p-1.5 sm:p-2.5 shadow-sm hover:shadow transition-all duration-300"
                aria-label={t("showcase.scroll_right")}
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Product Scroll Wrapper */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        {products.length > 0 ? (
          <>
            <div
              ref={scrollRef}
              className={`flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 pb-6 sm:pb-8 pt-2 no-scrollbar ${
                isDragging
                  ? "cursor-grabbing snap-none"
                  : "cursor-grab snap-x snap-mandatory"
              }`}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onClickCapture={handleClickCapture}
            >
              {products.map((p) => (
                <div
                  key={p.id}
                  className="snap-center flex-shrink-0 w-[200px] sm:w-[260px] md:w-[320px] select-none touch-auto"
                >
                  {region ? (
                    <ProductCard
                      product={p}
                      region={region}
                      cardType={cardStyle}
                    />
                  ) : (
                    <ProductShowcaseCard product={p} />
                  )}
                </div>
              ))}
            </div>

            {/* Pagination dots (Only visible on mobile/tablet) */}
            {products.length > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-2 mb-4 lg:hidden">
                {products.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const container = scrollRef.current
                      if (!container) return
                      const card = container.children[idx] as HTMLElement
                      if (card) {
                        card.scrollIntoView({
                          behavior: "smooth",
                          block: "nearest",
                          inline: "center",
                        })
                      }
                      setActiveDot(idx)
                    }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === activeDot
                        ? "w-5 bg-primary"
                        : "w-1.5 bg-muted-foreground/30"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-muted/20 border border-border/30 rounded-3xl mx-6 md:mx-12 mb-8">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl opacity-50">📦</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">
              {t("showcase.no_products_title")}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {t("showcase.no_products_desc")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

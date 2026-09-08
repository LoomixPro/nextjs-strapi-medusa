"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import { useTranslations, useLocale } from "next-intl"
import { getActiveSettings } from "@lib/util/storefront-settings"
import BlockHeader from "@modules/common/components/block-header"
import { isRtlLocale } from "@lib/util/is-rtl"
import { Copy, Check, ArrowLeft, Sparkles, ShoppingBag } from "lucide-react"

/**
 * Bento Grid Card Component (Standard)
 * Responsive: 2 side-by-side on mobile, scaled padding & fonts
 */
function BentoStandardCard({
  product,
  themeColor,
}: {
  product: any
  themeColor: { badgeBg: string; borderHover: string; glow: string }
}) {
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
      className={`group relative flex flex-col justify-between h-[230px] sm:h-[290px] md:h-[330px] rounded-2xl sm:rounded-3xl overflow-hidden bg-card/60 backdrop-blur-md border border-border/60 ${themeColor.borderHover} transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl shadow-sm block select-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0 bg-muted/20 overflow-hidden">
        <Image
          src={thumbnail}
          alt={productTitle}
          fill
          draggable={false}
          className={`object-cover transition-transform duration-700 ease-out ${
            isHovered ? "scale-108" : "scale-100"
          }`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {/* Dark subtle gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-black/10 transition-opacity duration-500 ${
            isHovered ? "opacity-95" : "opacity-85"
          }`}
        />
      </div>

      {/* Top Bar inside Card: Category + Discount */}
      <div className="relative z-10 p-2.5 sm:p-4 flex items-center justify-between w-full">
        <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider bg-black/40 backdrop-blur-md border border-white/10 text-white/90 truncate max-w-[90px] sm:max-w-none">
          {category}
        </span>
        {discount && (
          <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider bg-red-500 text-white shadow-md animate-pulse">
            -{discount}
          </span>
        )}
      </div>

      {/* Bottom Info inside Card */}
      <div className="relative z-10 p-2.5 sm:p-4 flex flex-col gap-1 sm:gap-2">
        <h3 className="text-xs sm:text-base md:text-lg font-bold text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors duration-300">
          {productTitle}
        </h3>

        <div className="flex items-center justify-between mt-0.5 sm:mt-1">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-xs sm:text-base md:text-lg font-extrabold text-foreground tracking-tight">
              {priceText}
            </span>
            {isSale && originalPriceText && (
              <span className="text-[9px] sm:text-xs text-muted-foreground line-through hidden xs:inline">
                {originalPriceText}
              </span>
            )}
          </div>

          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground flex items-center justify-center transition-all duration-300 group-hover:scale-110">
            <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

/**
 * Bento Grid Featured Hero Card (Spans 2 columns & 2 rows on desktop/mobile)
 */
function BentoFeaturedHeroCard({
  product,
  themeColor,
}: {
  product: any
  themeColor: { badgeBg: string; borderHover: string; glow: string }
}) {
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
      className={`group relative h-full min-h-[380px] sm:min-h-[500px] md:min-h-[560px] rounded-2xl sm:rounded-3xl overflow-hidden border border-border/80 ${themeColor.borderHover} transition-all duration-700 hover:-translate-y-1.5 hover:shadow-2xl shadow-md flex flex-col justify-between select-none`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Container with Ambient Glow */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-background">
        <Image
          src={thumbnail}
          alt={productTitle}
          fill
          priority
          draggable={false}
          className={`object-cover transition-transform duration-1000 ease-out ${
            isHovered ? "scale-105" : "scale-100"
          }`}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Dynamic Glow Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-background via-background/50 to-black/20 transition-opacity duration-700 ${
            isHovered ? "opacity-95" : "opacity-85"
          }`}
        />
        <div
          className={`absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-tl ${themeColor.glow} blur-3xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none`}
        />
      </div>

      {/* Top Header Badge Row */}
      <div className="relative z-10 p-4 sm:p-8 flex items-center justify-between w-full">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 text-primary text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary animate-pulse" />
          <span>
            {t.has("showcase.featured_pick")
              ? t("showcase.featured_pick")
              : "Featured Pick"}
          </span>
        </div>

        {discount && (
          <div className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-red-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-lg animate-bounce">
            -{discount}
          </div>
        )}
      </div>

      {/* Bottom Content Area */}
      <div className="relative z-10 p-4 sm:p-8 md:p-10 flex flex-col justify-end h-full pt-20 sm:pt-32">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary font-bold mb-1 sm:mb-2 block">
          {category}
        </span>
        <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-foreground mb-2 sm:mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300">
          {productTitle}
        </h3>

        {product.description && (
          <p className="text-xs sm:text-sm text-muted-foreground/90 font-light line-clamp-2 mb-4 sm:mb-6 max-w-xl leading-relaxed hidden sm:block">
            {product.description}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-2 border-t border-border/40">
          <div className="flex items-baseline gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl font-black text-foreground tracking-tight">
              {priceText}
            </span>
            {isSale && originalPriceText && (
              <span className="text-xs sm:text-base text-muted-foreground/70 line-through font-medium">
                {originalPriceText}
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-2 sm:px-6 sm:py-3 rounded-full bg-primary text-primary-foreground font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 group-hover:scale-105 shadow-md">
            <span>{t("showcase.quick_view")}</span>
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rtl:rotate-0 ltr:rotate-180 group-hover:-translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

/**
 * ProductShowcase Style 2 Component (Bento Grid + 2 Side-by-Side Mobile Swipe)
 */
export default function Style2({
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
  const t = useTranslations("HomePage")
  const locale = useLocale()
  const isRtl = isRtlLocale(locale)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    direction: isRtl ? "rtl" : "ltr",
    dragFree: false,
    loop: false,
  })

  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(true)

  const onSelect = React.useCallback((api: any) => {
    if (!api) return
    setCanScrollPrev(api.canScrollPrev())
    setCanScrollNext(api.canScrollNext())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit({
      direction: isRtl ? "rtl" : "ltr",
      align: "start",
      containScroll: "trimSnaps",
    })
    onSelect(emblaApi)
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, isRtl, products, onSelect])

  const handleScrollLeft = () => {
    if (!emblaApi) return
    if (isRtl) {
      emblaApi.scrollNext()
    } else {
      emblaApi.scrollPrev()
    }
  }

  const handleScrollRight = () => {
    if (!emblaApi) return
    if (isRtl) {
      emblaApi.scrollPrev()
    } else {
      emblaApi.scrollNext()
    }
  }

  const canGoLeft = isRtl ? canScrollNext : canScrollPrev
  const canGoRight = isRtl ? canScrollPrev : canScrollNext

  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // Countdown timer effect
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

  const copyPromoCode = () => {
    if (!promoCode) return
    navigator.clipboard.writeText(promoCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Theme colors depending on showcase type
  const getThemeColor = () => {
    switch (type) {
      case "campaign":
        return {
          glow: "from-amber-500/30 via-red-500/20 to-transparent",
          borderHover: "hover:border-amber-500/50",
          badgeBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        }
      case "discount":
        return {
          glow: "from-rose-500/30 via-purple-500/20 to-transparent",
          borderHover: "hover:border-rose-500/50",
          badgeBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
        }
      case "trending":
      default:
        return {
          glow: "from-cyan-500/30 via-blue-500/20 to-transparent",
          borderHover: "hover:border-cyan-500/50",
          badgeBg: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        }
    }
  }

  const themeColor = getThemeColor()

  const isCampaign =
    type === "campaign" ||
    Boolean(endsAt) ||
    Boolean(promoCode) ||
    Boolean(campaignId)

  // Campaigns always use the Featured Hero + Swipe track layout if at least 2 products exist.
  // Other showcase types activate swipe mode when products exceed 4.
  const isSwipeMode = isCampaign ? products.length > 1 : products.length > 4

  if (!products || products.length === 0) return null

  return (
    <section className="relative w-full py-6 overflow-hidden bg-transparent">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        {/* BlockHeader */}
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

        {/* Dynamic Campaign Controls Bar (Promo code & Timer) */}
        {(promoCode || (endsAt && timeLeft)) && (
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 -mt-4 mb-6 sm:mb-8 p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-card/40 backdrop-blur-xl border border-border/60 shadow-lg">
            {/* Left Side: Promo Code */}
            {promoCode && (
              <div className="flex items-center gap-2 sm:gap-3 bg-primary/5 border border-primary/20 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl">
                <span className="text-[10px] sm:text-xs font-bold text-primary uppercase">
                  {t("promo_code_label")}:
                </span>
                <span className="font-mono text-xs sm:text-sm font-black text-foreground tracking-wider">
                  {promoCode}
                </span>
                <button
                  onClick={copyPromoCode}
                  className="p-1 sm:p-1.5 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-all duration-200"
                  title="Copy Code"
                >
                  {copied ? (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  ) : (
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  )}
                </button>
              </div>
            )}

            {/* Right Side: Timer Counter */}
            {endsAt && timeLeft && (
              <div
                className="flex items-center gap-2 sm:gap-3 ms-auto"
                dir="ltr"
              >
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground font-medium me-1 sm:me-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span className="hidden sm:inline">Campaign Ends In:</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="flex flex-col items-center bg-background/80 border border-border px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl min-w-[36px] sm:min-w-[44px]">
                    <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                      {timeLeft.days}
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground">
                      {t("days")}
                    </span>
                  </div>
                  <span className="font-bold text-muted-foreground/50 text-xs sm:text-sm">
                    :
                  </span>
                  <div className="flex flex-col items-center bg-background/80 border border-border px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl min-w-[36px] sm:min-w-[44px]">
                    <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground">
                      {t("hours")}
                    </span>
                  </div>
                  <span className="font-bold text-muted-foreground/50 text-xs sm:text-sm">
                    :
                  </span>
                  <div className="flex flex-col items-center bg-background/80 border border-border px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl min-w-[36px] sm:min-w-[44px]">
                    <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground">
                      {t("minutes")}
                    </span>
                  </div>
                  <span className="font-bold text-muted-foreground/50 text-xs sm:text-sm">
                    :
                  </span>
                  <div className="flex flex-col items-center bg-background/80 border border-border px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl min-w-[36px] sm:min-w-[44px]">
                    <span className="text-xs sm:text-sm font-black text-foreground tabular-nums">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[7px] sm:text-[8px] uppercase tracking-wider text-muted-foreground">
                      Sec
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Layout rendering */}
        {isSwipeMode ? (
          /* Swipe Mode Layout (> 5 Products): Hero Card + 2 Side-by-Side Mobile Swipeable Track */
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-6 items-stretch overflow-hidden">
            {/* Featured Hero Card (Left Column) */}
            <div className="w-full lg:w-[420px] xl:w-[460px] flex-shrink-0">
              <BentoFeaturedHeroCard
                product={products[0]}
                themeColor={themeColor}
              />
            </div>

            {/* Swipeable Track (Right Column): 2 cards side-by-side with peek effect on mobile */}
            <div className="flex-1 min-w-0 relative group/track">
              {/* Soft trailing fade gradient indicating overflow scrollability */}
              <div className="absolute top-0 bottom-0 end-0 w-8 sm:w-14 bg-gradient-to-l rtl:bg-gradient-to-r from-background via-background/60 to-transparent pointer-events-none z-10 transition-opacity duration-300" />

              <div
                ref={emblaRef}
                dir={isRtl ? "rtl" : "ltr"}
                className="overflow-hidden cursor-grab active:cursor-grabbing select-none h-full"
              >
                <div className="flex gap-3 sm:gap-4 md:gap-6 py-2 touch-pan-y h-full items-center">
                  {products.slice(1).map((product, index) => (
                    <div
                      key={product.id || index}
                      className="w-[calc(44%-4px)] sm:w-[260px] md:w-[290px] flex-shrink-0 min-w-0"
                    >
                      <BentoStandardCard
                        product={product}
                        themeColor={themeColor}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Bento Grid Layout (<= 5 Products): 2 side-by-side on mobile */
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((product, index) => {
              if (index === 0) {
                return (
                  <div
                    key={product.id || index}
                    className="col-span-2 sm:col-span-2 md:col-span-2 lg:col-span-2"
                  >
                    <BentoFeaturedHeroCard
                      product={product}
                      themeColor={themeColor}
                    />
                  </div>
                )
              }

              return (
                <BentoStandardCard
                  key={product.id || index}
                  product={product}
                  themeColor={themeColor}
                />
              )
            })}
          </div>
        )}

        {/* Minimal Glowing Swipe Indicator (Underneath Cards: Pure Light & Interactive Arrows) */}
        {isSwipeMode && (
          <div className="flex items-center justify-center pt-4 sm:pt-6">
            <div className="relative group/pill inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-card/30 backdrop-blur-xl border border-primary/20 shadow-[0_0_25px_-5px_rgba(var(--primary),0.3)] hover:border-primary/40 transition-all duration-500 select-none">
              {/* Dynamic ambient backlight */}
              <div
                className={`absolute inset-0 -z-10 rounded-full bg-gradient-to-r ${themeColor.glow} blur-lg opacity-70 animate-pulse pointer-events-none`}
              />

              {/* Left interactive arrow button */}
              <button
                type="button"
                onClick={handleScrollLeft}
                disabled={!canGoLeft}
                aria-label="Scroll Left"
                className={`flex items-center gap-1 p-1 -m-1 rounded-full transition-all duration-300 ${
                  canGoLeft
                    ? "text-primary hover:scale-110 active:scale-90 cursor-pointer opacity-85 hover:opacity-100"
                    : "text-muted-foreground/40 opacity-30 cursor-not-allowed"
                }`}
              >
                <span className="w-3 sm:w-5 h-[1.5px] rounded-full bg-gradient-to-r from-transparent to-primary shadow-[0_0_6px_currentColor]" />
                <ArrowLeft className="w-3.5 h-3.5 -ms-1 text-primary drop-shadow-[0_0_8px_currentColor] transition-transform group-hover/pill:-translate-x-0.5" />
              </button>

              {/* Center glowing optical bead */}
              <div className="relative flex items-center justify-center px-1">
                <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_3px_currentColor] text-primary" />
                <span className="absolute w-4 h-4 rounded-full bg-primary/30 animate-ping" />
              </div>

              {/* Right interactive arrow button */}
              <button
                type="button"
                onClick={handleScrollRight}
                disabled={!canGoRight}
                aria-label="Scroll Right"
                className={`flex items-center gap-1 p-1 -m-1 rounded-full transition-all duration-300 ${
                  canGoRight
                    ? "text-primary hover:scale-110 active:scale-90 cursor-pointer opacity-85 hover:opacity-100"
                    : "text-muted-foreground/40 opacity-30 cursor-not-allowed"
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5 -me-1 rotate-180 text-primary drop-shadow-[0_0_8px_currentColor] transition-transform group-hover/pill:translate-x-0.5" />
                <span className="w-3 sm:w-5 h-[1.5px] rounded-full bg-gradient-to-l from-transparent to-primary shadow-[0_0_6px_currentColor]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

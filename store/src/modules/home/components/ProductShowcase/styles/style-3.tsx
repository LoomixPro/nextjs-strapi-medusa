"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import Image from "next/image"
import {
  motion,
  AnimatePresence,
  useSpring,
  useMotionValue,
  useTransform,
} from "framer-motion"
import { useTranslations, useLocale } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getProductPrice } from "@lib/util/get-product-price"
import { getActiveSettings } from "@lib/util/storefront-settings"
import { getNonColorOptions } from "@lib/util/product"
import { isRtlLocale } from "@lib/util/is-rtl"
import { useDictionary } from "@modules/common/components/dictionary-provider"
import WishlistButton from "@modules/products/components/wishlist-button"
import ProductColors from "@modules/products/components/product-colors"
import ShinyText from "@modules/common/components/ShinyText"
import { Button } from "@modules/common/components/shadcn/button"
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Star,
  Flame,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Tag,
  Clock,
} from "lucide-react"
import { cn } from "@lib/utils"
import { HttpTypes } from "@medusajs/types"

export default function Style3({
  products = [],
  title,
  badge,
  description,
  type,
  endsAt,
  promoCode,
  campaignId,
}: ProductShowcaseProps) {
  const tHome = useTranslations("HomePage")
  const locale = useLocale()
  const isRtl = isRtlLocale(locale)
  const translate = useDictionary()
  const settings = getActiveSettings()

  const defaultBadge =
    badge ||
    (type === "discount"
      ? tHome("showcase.special_offers") || "Special Offers"
      : type === "campaign"
        ? tHome("showcase.exclusive_campaign") || "Exclusive Campaign"
        : tHome("showcase.most_visited") || "✦ SPOTLIGHT SHOWCASE")

  const finalTitle = title || tHome("featured_products") || "Curated Showcase"
  const finalBadge = defaultBadge
  const finalDescription =
    description ||
    tHome("style1_desc") ||
    "Explore our most sought-after signature pieces designed with refined craftsmanship."

  // Active product index in the spotlight
  const [activeIndex, setActiveIndex] = useState(0)
  const activeProduct = products[activeIndex] || products[0]

  // Selected variant for the active product
  const [selectedVariant, setSelectedVariant] = useState<
    HttpTypes.StoreProductVariant | undefined
  >(undefined)

  // Active image index within the active product
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Autoplay state
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const isHoveredRef = useRef(false)

  // Promo code copy state
  const [isCopied, setIsCopied] = useState(false)

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  useEffect(() => {
    if (!endsAt) return

    const calculateTimeLeft = () => {
      const difference = +new Date(endsAt) - +new Date()
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        })
      } else {
        setTimeLeft(null)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [endsAt])

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Reset active image & variant when active product changes
  useEffect(() => {
    if (activeProduct) {
      setSelectedVariant(activeProduct.variants?.[0])
      setActiveImageIndex(0)
    }
  }, [activeIndex, activeProduct])

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying || !products || products.length <= 1) {
      setProgress(0)
      return
    }

    const duration = 6000 // 6 seconds per slide
    const intervalTime = 50
    const step = (intervalTime / duration) * 100

    const timer = setInterval(() => {
      if (isHoveredRef.current) return

      setProgress((prev) => {
        if (prev >= 100) {
          setActiveIndex((current) => (current + 1) % products.length)
          return 0
        }
        return prev + step
      })
    }, intervalTime)

    return () => clearInterval(timer)
  }, [isPlaying, products, activeIndex])

  // Active product images list (unconditional hook)
  const productImages = useMemo(() => {
    if (!activeProduct) return []
    const imgs: string[] = []
    if (selectedVariant?.thumbnail) imgs.push(selectedVariant.thumbnail)
    if (selectedVariant?.images?.length) {
      selectedVariant.images.forEach((img: any) => {
        if (img?.url && !imgs.includes(img.url)) imgs.push(img.url)
      })
    }
    if (activeProduct.thumbnail && !imgs.includes(activeProduct.thumbnail)) {
      imgs.push(activeProduct.thumbnail)
    }
    if (activeProduct.images?.length) {
      activeProduct.images.forEach((img: any) => {
        if (img?.url && !imgs.includes(img.url)) imgs.push(img.url)
      })
    }
    return imgs.length > 0
      ? imgs
      : [
          "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1000&auto=format&fit=crop",
        ]
  }, [activeProduct, selectedVariant])

  // Navigation handlers
  const handlePrev = useCallback(() => {
    setProgress(0)
    setActiveIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1))
  }, [products.length])

  const handleNext = useCallback(() => {
    setProgress(0)
    setActiveIndex((prev) => (prev + 1) % products.length)
  }, [products.length])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (isRtl) handleNext()
        else handlePrev()
      } else if (e.key === "ArrowRight") {
        if (isRtl) handlePrev()
        else handleNext()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNext, handlePrev, isRtl])

  // 3D Tilt interaction for spotlight card on desktop
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 20, stiffness: 200 }
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [7, -7]),
    springConfig
  )
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-7, 7]),
    springConfig
  )
  const glareX = useTransform(mouseX, [-0.5, 0.5], ["0%", "100%"])
  const glareY = useTransform(mouseY, [-0.5, 0.5], ["0%", "100%"])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const clientX = e.clientX - rect.left
    const clientY = e.clientY - rect.top
    mouseX.set(clientX / width - 0.5)
    mouseY.set(clientY / height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  if (!products || products.length === 0 || !activeProduct) return null

  const currentDisplayImage =
    productImages[activeImageIndex] || productImages[0]

  // Active product price calculations
  const { cheapestPrice, variantPrice } = getProductPrice({
    product: activeProduct,
    variantId: selectedVariant?.id,
    locale,
    settings,
  })

  const priceInfo = variantPrice || cheapestPrice
  const discountPercentage = priceInfo?.percentage_diff
    ? Math.abs(Math.round(Number(priceInfo.percentage_diff)))
    : 0

  // Non-color options (sizes, fits, etc.)
  const nonColorOptions = getNonColorOptions(activeProduct.options)

  const catalogHref = campaignId ? `/store?campaign_id=${campaignId}` : "/store"

  return (
    <div
      className="w-full relative overflow-hidden py-10 sm:py-16 selection:bg-primary selection:text-primary-foreground"
      onMouseEnter={() => {
        isHoveredRef.current = true
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
      }}
    >
      {/* Dynamic Ambient Mesh Glow Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-primary/10 via-primary/5 to-transparent blur-[140px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[20%] right-[-10%] w-[600px] h-[400px] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Deck */}
        <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-10 border-b border-border/40 pb-5 sm:pb-8">
          {/* Top Bar: Badge on start & Navigation Controls on end */}
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {finalBadge ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/25 bg-primary/5 text-primary text-[11px] sm:text-xs font-bold tracking-wider uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping inline-block" />
                <span>{finalBadge}</span>
              </div>
            ) : (
              <div />
            )}

            {/* Controls & Slide Counter Deck */}
            <div className="flex items-center gap-2 sm:gap-3 ms-auto">
              {/* Active Counter */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-muted/40 border border-border/50 font-mono text-[11px] sm:text-xs font-semibold text-foreground/80 tabular-nums">
                <span className="text-primary font-bold">
                  {String(activeIndex + 1).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-muted-foreground">
                  {String(products.length).padStart(2, "0")}
                </span>
              </div>

              {/* Play/Pause Autoplay with Progress Ring */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-card border border-border/70 hover:border-primary text-foreground transition-all duration-300 shadow-sm group"
                title={isPlaying ? "Pause Autoplay" : "Resume Autoplay"}
                aria-label={isPlaying ? "Pause Autoplay" : "Resume Autoplay"}
              >
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-muted/30 fill-none"
                  />
                  {isPlaying && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeDasharray="94.25"
                      strokeDashoffset={94.25 - (94.25 * progress) / 100}
                      className="text-primary fill-none transition-all duration-75 ease-linear"
                    />
                  )}
                </svg>
                {isPlaying ? (
                  <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground/80 group-hover:text-primary transition-colors" />
                ) : (
                  <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground/80 group-hover:text-primary translate-x-0.5 transition-colors" />
                )}
              </button>

              {/* Prev / Next Arrows */}
              <div className="flex items-center gap-0.5 sm:gap-1 bg-card border border-border/70 p-0.5 sm:p-1 rounded-full shadow-sm">
                <button
                  onClick={handlePrev}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-muted/80 text-foreground transition-colors"
                  aria-label="Previous Product"
                >
                  {isRtl ? (
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
                <button
                  onClick={handleNext}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center hover:bg-muted/80 text-foreground transition-colors"
                  aria-label="Next Product"
                >
                  {isRtl ? (
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Title & Description Row */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
              <ShinyText
                text={finalTitle}
                disabled={false}
                speed={3}
                className="inline-block"
                color="currentColor"
                shineColor="hsl(var(--primary))"
              />
            </h2>
            {finalDescription && (
              <p className="text-xs sm:text-base text-muted-foreground font-light max-w-2xl leading-relaxed">
                {finalDescription}
              </p>
            )}
          </div>

          {/* Extra Promo Code & Countdown Bar (if present) */}
          {(promoCode || (endsAt && timeLeft)) && (
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {promoCode && (
                <div
                  onClick={() => handleCopyPromo(promoCode)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-500 text-xs font-bold cursor-pointer hover:bg-red-500/20 transition-colors shadow-sm"
                  title="Click to copy promo code"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-mono">{promoCode}</span>
                  {isCopied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 opacity-60" />
                  )}
                </div>
              )}

              {endsAt && timeLeft && (
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-xs font-mono font-bold text-foreground"
                  dir="ltr"
                >
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {timeLeft.days}d {String(timeLeft.hours).padStart(2, "0")}:
                    {String(timeLeft.minutes).padStart(2, "0")}:
                    <span className="text-red-500">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* MAIN SPOTLIGHT STAGE: 2-COLUMN SPLIT ATELIER SHOWCASE */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center bg-card/60 backdrop-blur-2xl border border-border/60 rounded-[2.5rem] p-6 sm:p-8 lg:p-12 shadow-[0_25px_60px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden">
          {/* Subtle Decorative Grid lines */}
          <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

          {/* LEFT PANEL: 3D HOLOGRAPHIC PRODUCT STAGE */}
          <div className="lg:col-span-6 relative flex flex-col items-center">
            <motion.div
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full aspect-[4/5] sm:aspect-square md:aspect-[4/5] max-h-[540px] rounded-3xl overflow-hidden bg-gradient-to-b from-muted/40 via-muted/10 to-background border border-border/80 shadow-2xl group cursor-grab active:cursor-grabbing"
            >
              {/* Dynamic Glare Overlay */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-30 opacity-0 group-hover:opacity-20 transition-opacity duration-500 mix-blend-overlay"
                style={{
                  background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.8), transparent 70%)`,
                }}
              />

              {/* Floating Badges */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-black tracking-wider uppercase shadow-lg shadow-red-500/20 animate-bounce">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>-{discountPercentage}%</span>
                  </span>
                )}
                {activeProduct.collection?.title && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/60 text-[10px] font-bold text-foreground tracking-widest uppercase">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>{activeProduct.collection.title}</span>
                  </span>
                )}
              </div>

              {/* Wishlist Button in Top Right */}
              <div className="absolute top-4 right-4 z-20">
                <WishlistButton
                  variantId={
                    selectedVariant?.id || activeProduct.variants?.[0]?.id
                  }
                  className="rounded-full w-10 h-10 bg-background/80 backdrop-blur-md border-border/80 shadow-md hover:scale-110 transition-transform"
                />
              </div>

              {/* Active Product Image Stage with Cross-Fade */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeProduct.id}-${activeImageIndex}-${selectedVariant?.id}`}
                  initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.04, filter: "blur(4px)" }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="absolute inset-0 z-10 w-full h-full p-4 sm:p-8 flex items-center justify-center"
                >
                  <Image
                    src={currentDisplayImage}
                    alt={activeProduct.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-transform duration-700 group-hover:scale-105"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Inner ambient bottom shade */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/90 via-background/30 to-transparent z-10 pointer-events-none" />

              {/* Bottom Thumbnail Strip (Switch View Angles) */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center items-center gap-2 px-4">
                  <div className="flex items-center gap-1.5 p-1 rounded-full bg-background/80 backdrop-blur-md border border-border/70 shadow-lg">
                    {productImages.slice(0, 5).map((imgUrl, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveImageIndex(idx)
                        }}
                        className={cn(
                          "relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 transition-all duration-200",
                          activeImageIndex === idx
                            ? "border-primary scale-110 shadow-sm"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <Image
                          src={imgUrl}
                          alt="Thumbnail view"
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* RIGHT PANEL: INTERACTIVE ATELIER & PRODUCT SPEC SHEET */}
          <div className="lg:col-span-6 flex flex-col justify-between h-full z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                {/* Brand / Series Line */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase">
                    SHOWCASE NO. {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(products.length).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>4.9 / 5.0</span>
                  </div>
                </div>

                {/* Product Title */}
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                  {activeProduct.title}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {priceInfo?.calculated_price || "N/A"}
                  </span>
                  {priceInfo?.price_type === "sale" &&
                    priceInfo.original_price && (
                      <span className="text-base sm:text-lg text-muted-foreground/60 line-through font-medium">
                        {priceInfo.original_price}
                      </span>
                    )}
                  {discountPercentage > 0 && (
                    <span className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-md">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>

                {/* Product Description Snippet */}
                {activeProduct.description && (
                  <p className="text-sm text-muted-foreground font-light leading-relaxed line-clamp-4">
                    {activeProduct.description}
                  </p>
                )}

                {/* Variant Colors Swatch Picker */}
                {activeProduct.options?.some((opt: any) =>
                  opt.title?.toLowerCase().includes("color")
                ) && (
                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground tracking-wide uppercase">
                        {translate("Color")} / {translate("Finish")}
                      </span>
                    </div>
                    <ProductColors
                      product={activeProduct}
                      selectedVariant={selectedVariant}
                      onSelectVariant={(variant) => {
                        setSelectedVariant(variant)
                        setActiveImageIndex(0)
                      }}
                      size="md"
                      className="flex flex-wrap gap-2.5 justify-start"
                    />
                  </div>
                )}

                {/* Non-Color Variant Options (e.g. Size, Dimensions) */}
                {nonColorOptions.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-border/40">
                    {nonColorOptions.map((optGroup) => (
                      <div key={optGroup.name} className="space-y-2">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                          {translate(optGroup.name)}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {optGroup.values.map((val) => {
                            const isOptSelected =
                              selectedVariant?.options?.some(
                                (opt: any) =>
                                  opt.value?.toLowerCase() === val.toLowerCase()
                              )
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  const matchingVar =
                                    activeProduct.variants?.find((v) =>
                                      v.options?.some(
                                        (o: any) =>
                                          o.value?.toLowerCase() ===
                                          val.toLowerCase()
                                      )
                                    )
                                  if (matchingVar) {
                                    setSelectedVariant(matchingVar)
                                  }
                                }}
                                className={cn(
                                  "px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all duration-200 border",
                                  isOptSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                                    : "bg-muted/30 border-border/60 text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                                )}
                              >
                                {translate(val)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons: Direct Localized Link */}
                <div className="flex items-center gap-3 pt-6 border-t border-border/40">
                  <LocalizedClientLink
                    href={`/products/${activeProduct.handle || activeProduct.id}`}
                    className="flex-1"
                  >
                    <Button className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold tracking-wider text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all">
                      <span>
                        {tHome("view_product") || "View Product Details"}
                      </span>
                      {isRtl ? (
                        <ArrowLeft className="w-4 h-4" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                    </Button>
                  </LocalizedClientLink>

                  <LocalizedClientLink href={catalogHref}>
                    <Button
                      variant="outline"
                      className="h-12 px-5 rounded-2xl border-border/80 hover:bg-muted/40 font-semibold text-xs tracking-wider uppercase"
                    >
                      {tHome("view_all") || "View All"}
                    </Button>
                  </LocalizedClientLink>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

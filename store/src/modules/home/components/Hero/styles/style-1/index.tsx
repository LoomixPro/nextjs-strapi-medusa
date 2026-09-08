"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  Eye,
  ChevronDown,
} from "lucide-react"
import { cn } from "@lib/utils"
import { isRtlLocale } from "@lib/util/is-rtl"
import { getFeatureIcon } from "@modules/common/components/feature-icon"
import { HttpTypes } from "@medusajs/types"
import type { HeroSection, HeroHighlight } from "@lib/data/homepage"

interface HeroStyle1Props {
  section?: HeroSection | null
  heroProducts?: HttpTypes.StoreProduct[]
  region?: HttpTypes.StoreRegion
}

interface VisualSlide {
  title: string
  subtitle?: string
  image: string
  tag?: string
  link?: string
}

export default function HeroStyle1({
  section,
  heroProducts = [],
}: HeroStyle1Props) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("HomePage")
  const isRTL = isRtlLocale(locale)

  // 1. Prepare image slides: from selected Medusa products in Strapi, or fallback to section images / defaults
  const productSlides: VisualSlide[] =
    heroProducts && heroProducts.length > 0
      ? heroProducts.map((p, idx) => ({
          title: p.title,
          subtitle: p.subtitle || p.collection?.title || "Luxury Essential",
          image:
            p.thumbnail ||
            p.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
          tag: p.collection?.title || (idx === 0 ? "Featured" : "Popular"),
          link: `/products/${p.handle}`,
        }))
      : []

  const fallbackSlides: VisualSlide[] = [
    {
      title: section?.mainImages?.[0]?.alternativeText || "Haute Couture 2026",
      subtitle: "Spring / Summer Runway",
      image:
        section?.mainImages?.[0]?.url ||
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
      tag: "Featured",
      link: section?.buttonLink || "/store",
    },
    {
      title: section?.sideImages?.[0]?.alternativeText || "Luxury Tailoring",
      subtitle: "Artisanal Silk & Wool",
      image:
        section?.sideImages?.[0]?.url ||
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
      tag: "Trending",
      link: section?.buttonLink || "/store",
    },
    {
      title: section?.sideImages?.[1]?.alternativeText || "Handcrafted Leather",
      subtitle: "Exclusive Accessories",
      image:
        section?.sideImages?.[1]?.url ||
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
      tag: "Limited",
      link: section?.buttonLink || "/store",
    },
    {
      title: section?.sideImages?.[2]?.alternativeText || "Minimalist Elegance",
      subtitle: "Modern Architectural Fit",
      image:
        section?.sideImages?.[2]?.url ||
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
      tag: "Exclusive",
      link: section?.buttonLink || "/store",
    },
  ]

  const slides: VisualSlide[] =
    productSlides.length > 0 ? productSlides : fallbackSlides

  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const currentSlide = slides[activeSlideIndex] || slides[0]

  // Auto slide rotation every 6 seconds if not hovered
  const [isPaused, setIsPaused] = useState(false)
  useEffect(() => {
    if (isPaused || slides.length <= 1) return
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  // Content Fallbacks
  const badgeText = section?.badge || "Exclusive Haute Collection 2026"
  const titleText =
    section?.title || "Redefining Contemporary Luxury & Timeless Form"
  const descriptionText =
    section?.description ||
    "Experience bespoke craftsmanship and precision-tailored silhouettes designed for those who appreciate understated distinction and modern elegance."
  const buttonText = section?.buttonText || "Shop New Arrivals"
  const buttonLink = section?.buttonLink || "/store"

  const highlights: HeroHighlight[] =
    section?.highlights && section.highlights.length > 0
      ? section.highlights
      : [
          {
            id: 1,
            text: "100% Authentic",
            color: "emerald",
            icon_name: "shield-check",
          },
          {
            id: 2,
            text: "Free Express Shipping",
            color: "primary",
            icon_name: "truck",
          },
          {
            id: 3,
            text: "7-Day Easy Returns",
            color: "amber",
            icon_name: "rotate-ccw",
          },
        ]

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <section
      className="relative w-full min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-background text-foreground transition-colors duration-300"
      style={{ direction: isRTL ? "rtl" : "ltr" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Ambient Glow Lighting */}
      <div className="absolute top-[-10%] start-[-5%] w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] end-[-5%] w-[40vw] h-[40vw] rounded-full bg-accent/15 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[160px] pointer-events-none -z-10" />

      {/* Main Hero Grid Content */}
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 py-10 lg:py-16">
        {/* ================= LEFT / TEXT COLUMN ================= */}
        <motion.div
          initial={{ opacity: 0, x: isRTL ? 30 : -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-start max-w-2xl lg:max-w-none z-10"
        >
          {/* Luminous Capsule Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/80 border border-primary/20 backdrop-blur-md shadow-xs mb-6 text-xs sm:text-sm font-semibold text-primary"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-primary shrink-0" />
            <span className="tracking-wide">{badgeText}</span>
          </motion.div>

          {/* Grand Heading with Gradient Glow */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.08] mb-6 text-foreground">
            {titleText}
          </h1>

          {/* Subtitle Description */}
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed font-normal max-w-2xl mb-8">
            {descriptionText}
          </p>

          {/* Single CTA Action Button from Strapi */}
          <div className="flex items-center justify-center lg:justify-start mb-10 w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(buttonLink)}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-sm sm:text-base text-primary-foreground bg-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/95 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
              <span>{buttonText}</span>
              <ArrowIcon className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
            </motion.button>
          </div>

          {/* Trust Highlights Pill Row */}
          {highlights && highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 pt-6 border-t border-border/80 text-xs sm:text-sm text-muted-foreground font-medium w-full"
            >
              {highlights.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-2">
                  {getFeatureIcon({
                    iconName: item.icon_name,
                    color: item.color,
                    iconSize: 16,
                  })}
                  <span className="font-medium text-foreground/80">
                    {item.text}
                  </span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* ================= RIGHT / INTERACTIVE VISUAL STAGE ================= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 w-full max-w-xl lg:max-w-none flex flex-col items-center justify-center relative"
        >
          {/* Main Visual Showcase Card */}
          <div className="relative w-full aspect-[4/5] sm:aspect-[1/1] max-w-[560px] xl:max-w-[620px] rounded-3xl sm:rounded-[2.5rem] overflow-hidden p-2.5 bg-gradient-to-b from-border/80 via-border/30 to-border/80 shadow-2xl border border-border/50 group">
            {/* Halo Backdrop Glow */}
            <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] blur-2xl -z-10 group-hover:bg-primary/20 transition-colors duration-700" />

            <div className="relative w-full h-full rounded-[2rem] sm:rounded-[2.2rem] overflow-hidden bg-muted">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSlideIndex}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="relative w-full h-full"
                >
                  <Image
                    src={currentSlide.image}
                    alt={currentSlide.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  {/* Subtle Cinematic Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Bottom Spotlight Info Badge on Image */}
              <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-6 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-background/85 backdrop-blur-xl border border-white/20 text-foreground shadow-lg z-20">
                <div className="flex flex-col min-w-0 me-3">
                  <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-primary">
                    {currentSlide.tag || "Featured"}
                  </span>
                  <h2 className="font-bold text-xs sm:text-sm md:text-base truncate text-foreground">
                    {currentSlide.title}
                  </h2>
                </div>
                <button
                  onClick={() => router.push(currentSlide.link || buttonLink)}
                  className="shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-110 transition-transform cursor-pointer"
                  aria-label="Shop Item"
                >
                  <ArrowIcon className="w-4 h-4" />
                </button>
              </div>

              {/* Top Category Tag */}
              <div className="absolute top-4 start-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 text-white text-[11px] font-medium tracking-wide">
                ✦ 2026 Edition
              </div>
            </div>
          </div>

          {/* Interactive Satellite Carousel Selector Pills */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 sm:gap-3 mt-6 sm:mt-8 p-1.5 rounded-full bg-secondary/80 border border-border/80 backdrop-blur-md shadow-sm max-w-full overflow-x-auto">
              {slides.map((slide, idx) => {
                const isActive = activeSlideIndex === idx
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveSlideIndex(idx)}
                    className={cn(
                      "flex items-center gap-2 sm:gap-2.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full transition-all duration-300 text-xs sm:text-sm font-semibold cursor-pointer shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md scale-105"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "relative w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden shrink-0 border",
                        isActive
                          ? "border-primary-foreground/40"
                          : "border-border"
                      )}
                    >
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="hidden sm:inline-block max-w-[100px] truncate">
                      {slide.title}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ================= BOTTOM SCROLL EXPLORE INDICATOR ================= */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          delay: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="w-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10 pb-4 select-none"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({
              top: window.innerHeight,
              behavior: "smooth",
            })
          }
        }}
      >
        <span className="text-[11px] font-medium tracking-widest uppercase">
          {t("scroll_to_explore")}
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce text-primary" />
      </motion.div>
    </section>
  )
}

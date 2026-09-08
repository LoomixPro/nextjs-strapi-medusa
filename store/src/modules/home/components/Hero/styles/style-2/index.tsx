"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ChronicleButton } from "./chronicle-button"
import { getFeatureIcon } from "@modules/common/components/feature-icon"
import { isRtlLocale } from "@lib/util/is-rtl"
import type { HeroSection, HeroHighlight } from "@lib/data/homepage"

interface TextStyle {
  color?: string
  fontSize?: string
  gradient?: string
}

interface ButtonStyle {
  backgroundColor?: string
  color?: string
  borderRadius?: string
  hoverColor?: string
  hoverForeground?: string
}

interface SlideContent {
  title: string
  image: string
}

interface DicedHeroSectionProps {
  topText: string
  mainText: string
  subMainText: string
  buttonText: string
  slides: SlideContent[]
  highlights?: HeroHighlight[]
  onMainButtonClick?: () => void
  onGridImageHover?: (index: number) => void
  onGridImageClick?: (index: number) => void
  topTextStyle?: TextStyle
  mainTextStyle?: TextStyle
  subMainTextStyle?: TextStyle
  buttonStyle?: ButtonStyle
  componentBorderRadius?: string
  backgroundColor?: string
  separatorColor?: string
  maxContentWidth?: string
  mobileBreakpoint?: number
  fontFamily?: string
  isRTL?: boolean
}

export const DicedHeroSection: React.FC<DicedHeroSectionProps> = ({
  topText,
  mainText,
  subMainText,
  buttonText,
  slides,
  highlights,
  onMainButtonClick,
  onGridImageHover,
  onGridImageClick,
  mainTextStyle,
  subMainTextStyle,
  buttonStyle = {},
  componentBorderRadius = "0px",
  backgroundColor,
  separatorColor = "#005baa",
  maxContentWidth = "1536px",
  mobileBreakpoint = 1000,
  fontFamily = "inherit",
  isRTL: isRTLProp,
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()
  const t = useTranslations("HomePage")

  const isRTL = isRTLProp !== undefined ? isRTLProp : isRtlLocale(locale)

  useEffect(() => {
    const checkMobile = () => {
      if (containerRef.current) {
        setIsMobile(containerRef.current.offsetWidth < mobileBreakpoint)
      }
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [mobileBreakpoint])

  const getGradientStyle = (gradient?: string) => {
    if (gradient) {
      return {
        backgroundImage: gradient,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }
    }
    return {}
  }

  // Ensure 4 slide items
  const baseSlides = [
    slides[0] || { title: "Look 1", image: "" },
    slides[1] || { title: "Look 2", image: "" },
    slides[2] || { title: "Look 3", image: "" },
    slides[3] || { title: "Look 4", image: "" },
  ]

  // In LTR: Col 1 is [0, 2], Col 2 is [1, 3]
  // In RTL: Col 1 is [1, 3], Col 2 is [0, 2] so the visual columns mirror properly
  const gridSlides = isRTL
    ? [baseSlides[1], baseSlides[0], baseSlides[3], baseSlides[2]]
    : [baseSlides[0], baseSlides[1], baseSlides[2], baseSlides[3]]

  // Cutout classes for each position in 2x2 grid (Top-Left, Top-Right, Bottom-Left, Bottom-Right):
  // Top-Left cell -> bottom-right cutout (faces center)
  // Top-Right cell -> bottom-left cutout (faces center)
  // Bottom-Left cell -> top-right cutout (faces center)
  // Bottom-Right cell -> top-left cutout (faces center)
  const cutoutClasses = ["bottom-right", "bottom-left", "top-right", "top-left"]

  return (
    <main
      ref={containerRef}
      className="relative w-full min-h-[100dvh] flex flex-col justify-between items-center overflow-hidden pt-20 sm:pt-24 lg:pt-24 pb-4 sm:pb-6 select-none bg-transparent"
      style={{
        borderRadius: componentBorderRadius,
        backgroundColor: backgroundColor || "transparent",
        fontFamily,
      }}
    >
      {/* ================= MAIN CONTENT ROW ================= */}
      <div
        className="flex-1 w-full flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14 xl:gap-20 2xl:gap-24 px-4 sm:px-8 lg:px-12 my-auto z-10"
        style={{
          maxWidth: maxContentWidth,
          flexDirection: isMobile ? "column" : isRTL ? "row-reverse" : "row",
        }}
      >
        {/* ================= TEXT CONTENT COLUMN ================= */}
        <div
          style={{
            flex: 1.1,
            width: isMobile ? "100%" : "52%",
            maxWidth: isMobile ? "100%" : "52%",
            textAlign: isMobile ? "center" : isRTL ? "right" : "left",
            display: "flex",
            flexDirection: "column",
            alignItems: isMobile ? "center" : isRTL ? "flex-end" : "flex-start",
            justifyContent: "center",
            zIndex: 2,
            paddingBottom: isMobile ? "1.5rem" : 0,
            paddingLeft: isMobile ? 0 : isRTL ? "2.5rem" : 0,
            paddingRight: isMobile ? 0 : isRTL ? 0 : "2.5rem",
          }}
        >
          <div style={{ width: "100%" }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                direction: isRTL ? "rtl" : "ltr",
                textAlign: isMobile ? "center" : isRTL ? "right" : "left",
                marginBottom: "1rem",
              }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/60 border border-border text-foreground backdrop-blur-md text-xs sm:text-sm font-bold uppercase tracking-widest shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {topText}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-black tracking-tight leading-[1.08] mb-4 text-foreground"
              style={{
                ...mainTextStyle,
                direction: isRTL ? "rtl" : "ltr",
                textAlign: isMobile ? "center" : isRTL ? "right" : "left",
              }}
            >
              <motion.span
                style={{
                  ...getGradientStyle(mainTextStyle?.gradient),
                  display: "inline-block",
                }}
              >
                {mainText}
              </motion.span>
            </motion.h1>

            <motion.hr
              initial={{ width: 0 }}
              animate={{ width: "8rem" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{
                height: "0.3rem",
                background: separatorColor,
                borderRadius: "9999px",
                border: "none",
                margin: isMobile
                  ? "1.25rem auto 1.75rem"
                  : isRTL
                    ? "1.25rem 0 1.75rem auto"
                    : "1.25rem auto 1.75rem 0",
              }}
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base sm:text-lg md:text-xl lg:text-xl text-muted-foreground leading-relaxed max-w-2xl"
              style={{
                ...subMainTextStyle,
                ...getGradientStyle(subMainTextStyle?.gradient),
                direction: isRTL ? "rtl" : "ltr",
                textAlign: isMobile ? "center" : isRTL ? "right" : "left",
                margin: isMobile ? "0 auto" : 0,
              }}
            >
              {subMainText}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              marginTop: "2.25rem",
              display: "flex",
              width: "100%",
              justifyContent: isMobile
                ? "center"
                : isRTL
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <ChronicleButton
              text={buttonText}
              onClick={onMainButtonClick}
              hoverColor={buttonStyle?.hoverColor}
              hoverForeground={buttonStyle?.hoverForeground ?? "#fff"}
              borderRadius={buttonStyle?.borderRadius}
              fontFamily={fontFamily}
              customBackground={buttonStyle?.backgroundColor}
              customForeground={buttonStyle?.color}
              isRTL={isRTL}
            />
          </motion.div>

          {/* Quick Trust Highlights Pill Row */}
          {highlights && highlights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap items-center gap-4 sm:gap-6 pt-6 mt-6 border-t border-border text-xs sm:text-sm text-muted-foreground font-medium"
              style={{
                direction: isRTL ? "rtl" : "ltr",
                justifyContent: isMobile
                  ? "center"
                  : isRTL
                    ? "flex-start"
                    : "flex-start",
                width: "100%",
              }}
            >
              {highlights.map((item, index) => (
                <div key={item.id || index} className="flex items-center gap-2">
                  {getFeatureIcon({
                    iconName: item.icon_name,
                    color: item.color,
                    iconSize: 16,
                  })}
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* ================= 4-IMAGE WARPED GRID COLUMN ================= */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            width: isMobile ? "100%" : "48%",
            maxWidth: isMobile ? "100%" : "48%",
            paddingLeft: isMobile ? 0 : isRTL ? 0 : "1.5rem",
            paddingRight: isMobile ? 0 : isRTL ? "1.5rem" : 0,
          }}
        >
          <div
            dir="ltr"
            className="w-full max-w-[360px] sm:max-w-[480px] md:max-w-[540px] lg:max-w-[580px] xl:max-w-[650px] 2xl:max-w-[700px] aspect-square"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: isMobile ? "14px" : "22px",
            }}
          >
            {gridSlides.map((slide, index) => (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: "100%",
                  paddingBottom: "100%",
                  overflow: "hidden",
                  borderRadius: isMobile ? "18px" : "26px",
                }}
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 350px"
                  priority={index === 0}
                  className={`warped-image ${cutoutClasses[index]}`}
                  style={{
                    objectFit: "cover",
                    cursor: "pointer",
                    transition:
                      "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease",
                  }}
                  onClick={() => onGridImageClick && onGridImageClick(index)}
                  onMouseEnter={() =>
                    onGridImageHover && onGridImageHover(index)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= BOTTOM SCROLL INDICATOR ================= */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          delay: 0.6,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        className="w-full flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10 pt-1"
        onClick={() => {
          if (typeof window !== "undefined") {
            window.scrollTo({
              top: window.innerHeight,
              behavior: "smooth",
            })
          }
        }}
      >
        <span className="text-[11px] font-medium tracking-widest uppercase select-none">
          {t("scroll_to_explore")}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </motion.div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .warped-image {
          --r: 28px;
          --s: 56px;
          --x: 35px;
          --y: 8px;
        }
        @media (max-width: 1024px) {
          .warped-image {
            --r: 22px;
            --s: 44px;
            --x: 28px;
            --y: 6px;
          }
        }
        @media (max-width: 768px) {
          .warped-image {
            --r: 16px;
            --s: 32px;
            --x: 20px;
            --y: 5px;
          }
        }
        @media (max-width: 480px) {
          .warped-image {
            --r: 12px;
            --s: 24px;
            --x: 15px;
            --y: 4px;
          }
        }
        .top-right {
          --_m: /calc(2*var(--r)) calc(2*var(--r)) radial-gradient(#000 70%,#0000 72%);
          --_g: conic-gradient(at calc(100% - var(--r)) var(--r),#0000 25%,#000 0);
          --_d: (var(--s) + var(--r));
          mask: calc(100% - var(--_d) - var(--x)) 0 var(--_m), 100% calc(var(--_d) + var(--y)) var(--_m), radial-gradient(var(--s) at 100% 0,#0000 99%,#000 calc(100% + 1px)) calc(-1*var(--r) - var(--x)) calc(var(--r) + var(--y)), var(--_g) calc(-1*var(--_d) - var(--x)) 0, var(--_g) 0 calc(var(--_d) + var(--y));
          -webkit-mask: calc(100% - var(--_d) - var(--x)) 0 var(--_m), 100% calc(var(--_d) + var(--y)) var(--_m), radial-gradient(var(--s) at 100% 0,#0000 99%,#000 calc(100% + 1px)) calc(-1*var(--r) - var(--x)) calc(var(--r) + var(--y)), var(--_g) calc(-1*var(--_d) - var(--x)) 0, var(--_g) 0 calc(var(--_d) + var(--y));
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
        }
        .top-left {
          --_m: /calc(2*var(--r)) calc(2*var(--r)) radial-gradient(#000 70%,#0000 72%);
          --_g: conic-gradient(at var(--r) var(--r),#000 75%,#0000 0);
          --_d: (var(--s) + var(--r));
          mask: calc(var(--_d) + var(--x)) 0 var(--_m), 0 calc(var(--_d) + var(--y)) var(--_m), radial-gradient(var(--s) at 0 0,#0000 99%,#000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(var(--r) + var(--y)), var(--_g) calc(var(--_d) + var(--x)) 0, var(--_g) 0 calc(var(--_d) + var(--y));
          -webkit-mask: calc(var(--_d) + var(--x)) 0 var(--_m), 0 calc(var(--_d) + var(--y)) var(--_m), radial-gradient(var(--s) at 0 0,#0000 99%,#000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(var(--r) + var(--y)), var(--_g) calc(var(--_d) + var(--x)) 0, var(--_g) 0 calc(var(--_d) + var(--y));
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
        }
        .bottom-left {
          --_m: /calc(2*var(--r)) calc(2*var(--r)) radial-gradient(#000 70%,#0000 72%);
          --_g: conic-gradient(from 180deg at var(--r) calc(100% - var(--r)),#0000 25%,#000 0);
          --_d: (var(--s) + var(--r));
          mask: calc(var(--_d) + var(--x)) 100% var(--_m), 0 calc(100% - var(--_d) - var(--y)) var(--_m), radial-gradient(var(--s) at 0 100%,#0000 99%,#000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(-1*var(--r) - var(--y)), var(--_g) calc(var(--_d) + var(--x)) 0, var(--_g) 0 calc(-1*var(--_d) - var(--y));
          -webkit-mask: calc(var(--_d) + var(--x)) 100% var(--_m), 0 calc(100% - var(--_d) - var(--y)) var(--_m), radial-gradient(var(--s) at 0 100%,#0000 99%,#000 calc(100% + 1px)) calc(var(--r) + var(--x)) calc(-1*var(--r) - var(--y)), var(--_g) calc(var(--_d) + var(--x)) 0, var(--_g) 0 calc(-1*var(--_d) - var(--y));
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
        }
        .bottom-right {
          --_m: /calc(2*var(--r)) calc(2*var(--r)) radial-gradient(#000 70%,#0000 72%);
          --_g: conic-gradient(from 90deg at calc(100% - var(--r)) calc(100% - var(--r)),#0000 25%,#000 0);
          --_d: (var(--s) + var(--r));
          mask: calc(100% - var(--_d) - var(--x)) 100% var(--_m), 100% calc(100% - var(--_d) - var(--y)) var(--_m), radial-gradient(var(--s) at 100% 100%,#0000 99%,#000 calc(100% + 1px)) calc(-1*var(--r) - var(--x)) calc(-1*var(--r) - var(--y)), var(--_g) calc(-1*var(--_d) - var(--x)) 0, var(--_g) 0 calc(-1*var(--_d) - var(--y));
          -webkit-mask: calc(100% - var(--_d) - var(--x)) 100% var(--_m), 100% calc(100% - var(--_d) - var(--y)) var(--_m), radial-gradient(var(--s) at 100% 100%,#0000 99%,#000 calc(100% + 1px)) calc(-1*var(--r) - var(--x)) calc(-1*var(--r) - var(--y)), var(--_g) calc(-1*var(--_d) - var(--x)) 0, var(--_g) 0 calc(-1*var(--_d) - var(--y));
          mask-repeat: no-repeat;
          -webkit-mask-repeat: no-repeat;
        }
        .warped-image:hover {
          transform: scale(1.04);
        }
      `,
        }}
      />
    </main>
  )
}

export interface HeroStyle2Props {
  section?: HeroSection | null
}

export default function HeroStyle2({ section }: HeroStyle2Props) {
  const router = useRouter()
  const locale = useLocale()

  const isRTL = isRtlLocale(locale)

  const allHeroImages = [
    ...(section?.sideImages || []),
    ...(section?.mainImages || []),
  ]

  const fallbackImages = [
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
  ]

  const fallbackTitles = [
    "Spring Collection",
    "Luxury Outerwear",
    "Leather Accessories",
    "Contemporary Minimal",
  ]

  const defaultSlides: SlideContent[] = [0, 1, 2, 3].map((index) => {
    const img = allHeroImages[index]
    return {
      title: img?.alternativeText || fallbackTitles[index],
      image: img?.url || fallbackImages[index],
    }
  })

  const topText = section?.badge || "New Season 2026"
  const mainText = section?.title || "Elevate Your Signature Style"
  const subMainText =
    section?.description ||
    "Discover the latest runway collections and contemporary luxury essentials crafted for effortless elegance."
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

  return (
    <DicedHeroSection
      topText={topText}
      mainText={mainText}
      subMainText={subMainText}
      buttonText={buttonText}
      slides={defaultSlides}
      highlights={highlights}
      onMainButtonClick={() => router.push(buttonLink)}
      onGridImageClick={() => router.push("/store")}
      buttonStyle={{
        backgroundColor: "#005baa",
        color: "#ffffff",
        hoverColor: "#004885",
        hoverForeground: "#ffffff",
        borderRadius: "9999px",
      }}
      separatorColor="#005baa"
      backgroundColor="transparent"
      maxContentWidth="1680px"
      isRTL={isRTL}
    />
  )
}

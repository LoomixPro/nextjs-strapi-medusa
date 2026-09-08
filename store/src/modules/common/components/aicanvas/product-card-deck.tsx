"use client"

import { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  animate,
  motion,
  usePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { ArrowDown } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

const hasPersian = (text?: string) =>
  text ? /[\u0600-\u06FF]/.test(text) : false

const VISIBLE = 4
const SLOT_X = [0, 16, -16, 10]
const SLOT_Y = [0, -18, -36, -54]
const SLOT_SCALE = [1, 0.96, 0.92, 0.88]
const SLOT_OPACITY = [1, 0.98, 0.93, 0.84]
const SLOT_ROTATE = [0, 4.5, -4.5, 2.5]

const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 }

function CardFace({
  product,
  isTop,
  buttonText: _buttonText,
  buttonLink: _buttonLink,
  colorCodeMap,
}: {
  product: any
  isTop: boolean
  buttonText?: string
  buttonLink?: string
  colorCodeMap: Map<string, string>
}) {
  const t = useTranslations("HomePage")
  const imageUrl = product.thumbnail || product.images?.[0]?.url
  const prodTitle = product.title
  const prodDesc = product.description
  const collTitle =
    product.collection?.title || product.collection || "YOUR BRAND"

  const [priceText, setPriceText] = useState<string>(product.price || "")

  useEffect(() => {
    if (product.variants?.[0]) {
      const priceInfo = getPricesForVariant(product.variants[0])
      if (priceInfo?.calculated_price) {
        setPriceText(priceInfo.calculated_price)
      }
    }
  }, [product])

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden bg-background border border-border/60"
      style={{
        borderRadius: 22,
        boxShadow: isTop
          ? "0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)"
          : "0 8px 20px rgba(0,0,0,0.05)",
      }}
      dir="rtl"
    >
      {/* Image half */}
      <div className="relative w-full h-[40%] min-h-[200px] overflow-hidden bg-muted/10 shrink-0">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={prodTitle}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        )}
      </div>

      {/* Content half */}
      <div
        className="flex flex-col flex-1 p-5 overflow-y-auto no-scrollbar pointer-events-auto"
        onPointerDown={(_e) => {
          // If the user drags vertically on the content area, allow scrolling.
          // We don't stop propagation completely because we want the card to flick on horizontal swipe.
          // But Framer Motion drag might interfere with vertical scroll.
        }}
      >
        <div className="flex justify-between items-start mb-3">
          <span className="inline-flex px-2 py-0.5 bg-primary/5 rounded-full text-[9px] font-semibold text-primary border border-primary/10 tracking-widest">
            {collTitle}
          </span>
        </div>

        <h3 className="text-lg font-black text-foreground leading-tight mb-2 tracking-tight">
          {prodTitle}
        </h3>

        <p className="text-[11px] text-muted-foreground leading-relaxed font-light mb-4 line-clamp-2">
          {prodDesc}
        </p>

        {/* Options / Variants */}
        {product.options && product.options.length > 0 && (
          <div className="flex flex-col gap-3 mb-4 bg-muted/5 p-3 rounded-xl border border-border/40">
            {product.options.map((option: any) => {
              const uniqueValues = Array.from(
                new Set(option.values?.map((v: any) => v.value || v) || [])
              )
              return (
                <div key={option.id || option.title} className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-2 bg-primary/40 rounded-full"></div>
                    <span className="text-[9px] font-bold text-muted-foreground tracking-widest uppercase">
                      {option.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueValues.map((val: any, i: number) => {
                      const isColorOption =
                        option.title?.toLowerCase() === "color"
                      let hexColor = val
                      let displayName = val

                      if (typeof val === "string" && val.includes("::")) {
                        const parts = val.split("::")
                        displayName = parts[0]
                        hexColor = parts[1]
                      }

                      if (isColorOption) {
                        const colorNameLower = displayName.toLowerCase()
                        const finalColor =
                          colorCodeMap.get(colorNameLower) || hexColor || "#ccc"
                        return (
                          <span
                            key={i}
                            title={displayName}
                            className="w-5 h-5 rounded-full border border-black/10 shadow-sm"
                            style={{ backgroundColor: finalColor }}
                          />
                        )
                      }

                      return (
                        <span
                          key={i}
                          className="px-2 py-1 text-[9px] font-medium bg-background border border-border rounded-md text-foreground/80 uppercase"
                        >
                          <span>{displayName}</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-sm font-bold tracking-wide">{priceText}</span>
          <LocalizedClientLink
            href={`/products/${product.handle || "#"}`}
            className="px-4 py-2 bg-foreground text-background rounded-full text-[10px] font-semibold tracking-widest hover:bg-primary transition-colors cursor-pointer relative z-50 pointer-events-auto"
            onPointerDown={(event: any) => event.stopPropagation()}
          >
            {t("buy")}
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

function FlickCard({
  product,
  slot,
  isTop,
  onFlick,
  buttonText,
  buttonLink,
  colorCodeMap,
}: {
  product: any
  slot: number
  isTop: boolean
  onFlick: () => void
  buttonText?: string
  buttonLink?: string
  colorCodeMap: Map<string, string>
}) {
  const [isPresent, safeToRemove] = usePresence()
  const x = useMotionValue(SLOT_X[slot])
  const y = useMotionValue(SLOT_Y[slot])
  const scale = useMotionValue(SLOT_SCALE[slot])
  const opacity = useMotionValue(SLOT_OPACITY[slot])
  const rotate = useTransform(
    x,
    [-200, 200],
    [-18 + SLOT_ROTATE[slot], 18 + SLOT_ROTATE[slot]],
    { clamp: true }
  )
  const flickVel = useRef({ x: 0, y: 0 })
  const isDragging = useRef(false)
  const router = useRouter()
  const { countryCode } = useParams()

  useEffect(() => {
    if (!isPresent) return
    const controls = [
      animate(x, SLOT_X[slot], SPRING),
      animate(y, SLOT_Y[slot], SPRING),
      animate(scale, SLOT_SCALE[slot], SPRING),
      animate(opacity, SLOT_OPACITY[slot], { duration: 0.3, ease: "easeOut" }),
    ]
    return () => controls.forEach((c) => c.stop())
  }, [slot, isPresent, x, y, scale, opacity])

  useEffect(() => {
    if (isPresent) return
    const v = flickVel.current

    // If unmounted without a flick (e.g. React Strict Mode double-mount), skip exit animation
    if (v.x === 0 && v.y === 0) {
      if (typeof safeToRemove === "function") safeToRemove()
      return
    }

    const mag = Math.hypot(v.x, v.y) || 1
    animate(x, (v.x / mag) * 1500, { duration: 0.5, ease: "easeOut" })
    animate(y, (v.y / mag) * 1500, { duration: 0.5, ease: "easeOut" })
    animate(opacity, 0, { duration: 0.45, ease: "easeOut" })
    const last = animate(scale, 0.85, {
      duration: 0.5,
      ease: "easeOut",
      onComplete: () => {
        if (typeof safeToRemove === "function") {
          safeToRemove()
        }
      },
    })
    return () => last.stop()
  }, [isPresent, safeToRemove, x, y, scale, opacity])

  const handleDragStart = () => {
    isDragging.current = true
  }

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    setTimeout(() => {
      isDragging.current = false
    }, 150) // delay reset to block subsequent clicks

    const speed = Math.hypot(info.velocity.x, info.velocity.y)
    const dist = Math.hypot(info.offset.x, info.offset.y)
    if (speed > 500 || dist > 130) {
      flickVel.current =
        speed > 220
          ? { x: info.velocity.x, y: info.velocity.y }
          : { x: info.offset.x * 9, y: info.offset.y * 9 }
      onFlick()
    } else {
      animate(x, SLOT_X[slot], SPRING)
      animate(y, SLOT_Y[slot], SPRING)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.stopPropagation()
      e.preventDefault()
      return
    }

    // Check if the user clicked on a link, button, or color swatch
    const target = e.target as HTMLElement
    if (
      target.closest("a") ||
      target.closest("button") ||
      target.hasAttribute("title")
    ) {
      return
    }

    if (isTop && product?.handle) {
      const localePrefix = countryCode ? `/${countryCode}` : ""
      router.push(`${localePrefix}/products/${product.handle}`)
    }
  }

  return (
    <motion.div
      style={{
        x,
        y,
        scale,
        opacity,
        rotate,
        position: "absolute",
        inset: 0,
        zIndex: 100 - slot,
        cursor: isTop ? "grab" : "auto",
        touchAction: isTop ? "none" : "auto",
      }}
      drag={isTop}
      onDragStart={isTop ? handleDragStart : undefined}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
      onClickCapture={isTop ? handleCardClick : undefined}
    >
      <CardFace
        product={product}
        isTop={isTop}
        buttonText={buttonText}
        buttonLink={buttonLink}
        colorCodeMap={colorCodeMap}
      />
    </motion.div>
  )
}

export interface ProductCardDeckProps {
  products: any[]
  buttonText?: string
  buttonLink?: string
}

export default function ProductCardDeck({
  products = [],
  buttonText,
  buttonLink,
}: ProductCardDeckProps) {
  const t = useTranslations("HomePage")
  const [deck, setDeck] = useState<any[]>(() => {
    return Array.from(
      { length: Math.min(VISIBLE, products.length || 0) },
      (_, i) => ({ key: i, content: i })
    )
  })

  const nextKey = useRef(VISIBLE)

  if (!products || products.length === 0) return null

  const handleFlick = () => {
    setDeck((prev) => {
      const rest = prev.slice(1)
      const lastContent = prev[prev.length - 1].content
      const newCard = {
        key: nextKey.current++,
        content: (lastContent + 1) % products.length,
      }
      return [...rest, newCard]
    })
  }

  // Pre-calculate color code map for all products
  const colorCodeMap = new Map<string, string>()
  products.forEach((product: any) => {
    product.variants?.forEach((variant: any) => {
      const colorOption = variant.options?.find(
        (opt: any) =>
          opt.title?.toLowerCase() === "color" ||
          opt.option?.title?.toLowerCase() === "color"
      )
      if (colorOption?.value) {
        const colorValue = colorOption.value.toLowerCase()
        const metadata = variant.metadata || variant.user_metadata
        if (!colorCodeMap.has(colorValue) && metadata?.color_code) {
          colorCodeMap.set(colorValue, metadata.color_code as string)
        }
      }
    })
  })

  return (
    <div
      className="relative flex w-full flex-col items-center justify-center py-4 px-4 md:hidden overflow-x-hidden overflow-y-visible"
      style={{ minHeight: "65vh" }}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-[380px]">
        <div
          className="relative w-full"
          style={{
            height: "65vh",
            maxHeight: "600px",
            minHeight: "450px",
          }}
        >
          <AnimatePresence>
            {deck.map((item, i) => (
              <FlickCard
                key={item.key}
                product={products[item.content % products.length]}
                slot={i}
                isTop={i === 0}
                onFlick={handleFlick}
                buttonText={buttonText}
                buttonLink={buttonLink}
                colorCodeMap={colorCodeMap}
              />
            ))}
          </AnimatePresence>
        </div>

        <p className="text-[10px] tracking-widest uppercase font-bold animate-pulse text-muted-foreground">
          {t("drag_card")}
        </p>

        {/* Main CTA Button under deck */}
        {buttonText && (
          <div className="glow-container rounded-full inline-block mt-2">
            <LocalizedClientLink
              href={buttonLink || "#"}
              className="btn-shine relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-primary px-8 py-3 text-xs font-semibold text-primary-foreground transition-all duration-300"
            >
              <span
                className={`relative z-10 uppercase ${
                  hasPersian(buttonText) ? "tracking-normal" : "tracking-widest"
                }`}
              >
                {buttonText}
              </span>
              <ArrowDown
                className="relative z-10 rotate-90 transition-transform group-hover:-translate-x-1"
                width={16}
              />
            </LocalizedClientLink>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"
import { resolveVariantImages } from "@lib/util/product"
import { isColorTitle, buildColorCodeMap } from "@lib/util/product-colors"

interface ImageGalleryProps {
  images: HttpTypes.StoreProductImage[]
  variants?: HttpTypes.StoreProductVariant[] | null
  product?: HttpTypes.StoreProduct
}

export default function ImageGalleryStyle2({
  images,
  variants,
  product,
}: ImageGalleryProps) {
  const t = useTranslations("Product.gallery")
  const searchParams = useSearchParams()
  const vId = searchParams?.get("v_id")

  // Ref to track locally initiated variant selection and prevent stale searchParams from flickering
  const pendingVariantIdRef = useRef<string | null>(null)

  const [activeVariantId, setActiveVariantId] = useState<string | null>(
    () => vId || null
  )

  // Listen to URL changes from external navigation (e.g., browser Back / Forward)
  useEffect(() => {
    const urlVId = searchParams?.get("v_id")
    if (!urlVId) return

    // If the URL has caught up with our local pending selection, clear pending
    if (pendingVariantIdRef.current === urlVId) {
      pendingVariantIdRef.current = null
      return
    }

    // If we have a pending user selection that the URL hasn't caught up with yet, DO NOT overwrite!
    if (pendingVariantIdRef.current && urlVId !== pendingVariantIdRef.current) {
      return
    }

    setActiveVariantId(urlVId)
  }, [searchParams])

  // Listen to immediate custom event from actions or swatch clicks
  useEffect(() => {
    const handleVariantChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ variantId: string }>
      if (customEvent.detail?.variantId) {
        pendingVariantIdRef.current = customEvent.detail.variantId
        setActiveVariantId(customEvent.detail.variantId)
      }
    }

    window.addEventListener("product:variant-change", handleVariantChange)
    return () => {
      window.removeEventListener("product:variant-change", handleVariantChange)
    }
  }, [])

  // Color option and map for the floating squircle swatches pod under the photo on mobile
  const colorOption = useMemo(() => {
    return product?.options?.find((o) => isColorTitle(o.title))
  }, [product?.options])

  const colorCodeMap = useMemo(() => {
    return product ? buildColorCodeMap(product) : new Map<string, string>()
  }, [product])

  // Determine currently active color value from activeVariantId, vId, or default variant
  const activeColorValue = useMemo(() => {
    if (!colorOption) return null
    const targetId = activeVariantId || vId
    if (targetId && product?.variants?.length) {
      const currentVariant = product.variants.find((v) => v.id === targetId)
      const colorOpt = currentVariant?.options?.find(
        (o: any) =>
          o.option_id === colorOption.id ||
          o.option?.id === colorOption.id ||
          isColorTitle(o.title) ||
          isColorTitle(o.option?.title)
      )
      if (colorOpt?.value) return colorOpt.value.toLowerCase()
    }
    const firstVariant = product?.variants?.[0]
    const firstOpt = firstVariant?.options?.find(
      (o: any) =>
        o.option_id === colorOption.id ||
        o.option?.id === colorOption.id ||
        isColorTitle(o.title) ||
        isColorTitle(o.option?.title)
    )
    return (
      firstOpt?.value?.toLowerCase() ||
      colorOption.values?.[0]?.value?.toLowerCase() ||
      null
    )
  }, [activeVariantId, vId, product, colorOption])

  const handleSelectColor = (colorValue: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("product:select-color", {
          detail: { colorValue },
        })
      )
    }
  }

  // Reactively determine active images from selected variant or fallbacks
  const effectiveImages = useMemo(() => {
    return resolveVariantImages(product, activeVariantId, images)
  }, [product, activeVariantId, images])

  const [activeIndex, setActiveIndex] = useState(0)
  const [prevImages, setPrevImages] = useState(effectiveImages)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Synchronous reset when images set changes to prevent double-render flicker
  if (effectiveImages !== prevImages) {
    setPrevImages(effectiveImages)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ left: 0 })
    }
  }, [effectiveImages])

  const scrollToImage = (index: number) => {
    setActiveIndex(index)
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.offsetWidth
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      })
    }
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, offsetWidth } = scrollContainerRef.current
      if (offsetWidth > 0) {
        const index = Math.round(scrollLeft / offsetWidth)
        if (
          index !== activeIndex &&
          index >= 0 &&
          index < effectiveImages.length
        ) {
          setActiveIndex(index)
        }
      }
    }
  }

  if (!effectiveImages.length) return null

  return (
    <div className="w-full">
      {/* ── Mobile Gallery with Bullets (Matching Modern Mobile PDP) ── */}
      <div className="md:hidden relative w-full mb-3">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full aspect-[3/4] sm:aspect-[4/5] rounded-3xl overflow-x-auto overflow-y-hidden flex snap-x snap-mandatory scrollbar-none bg-neutral-100 dark:bg-neutral-900 border border-border/40 shadow-lg relative"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {effectiveImages.map((img, index) => (
            <div
              key={img.id || index}
              className="w-full h-full flex-shrink-0 snap-center relative"
            >
              <Image
                src={img.url}
                alt={t("product_image_alt", { index: index + 1 })}
                fill
                priority={index === 0}
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ))}
        </div>

        {/* Bullets Pagination Dots */}
        {effectiveImages.length > 1 && (
          <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-2 z-10 pointer-events-auto">
            {effectiveImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => scrollToImage(index)}
                className={cn(
                  "transition-all duration-300 rounded-full cursor-pointer",
                  activeIndex === index
                    ? "w-6 h-2 bg-white shadow-md scale-105"
                    : "w-2 h-2 bg-white/40 hover:bg-white/70"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Color Swatches Pod Directly Under The Photo (Mobile) ── */}
      {colorOption && (colorOption.values?.length ?? 0) > 0 && (
        <div className="md:hidden flex flex-col items-center justify-center my-3 w-full">
          <div className="inline-flex items-center justify-center gap-2.5 p-2 rounded-2xl bg-neutral-900/90 dark:bg-neutral-900/90 border border-white/10 shadow-xl backdrop-blur-xl max-w-full overflow-x-auto scrollbar-none">
            {colorOption.values?.map((v) => {
              const colorVal = v.value.toLowerCase()
              const colorHex = colorCodeMap.get(colorVal) ?? colorVal
              const isSelected = activeColorValue === colorVal
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelectColor(v.value)}
                  className={cn(
                    "w-11 h-11 rounded-xl transition-all duration-200 relative cursor-pointer shrink-0 flex items-center justify-center",
                    "border border-white/15 shadow-sm",
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-neutral-900 scale-105 shadow-md"
                      : "hover:scale-105 opacity-85 hover:opacity-100",
                    "active:scale-95"
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

      {/* ── Desktop Gallery (Sticky with Thumbnails) ── */}
      <div className="hidden md:block sticky top-8">
        <div className="rounded-3xl overflow-hidden border border-border/50 shadow-sm mb-4 aspect-[4/5] relative bg-neutral-100 dark:bg-neutral-900">
          {effectiveImages[activeIndex] && (
            <Image
              src={effectiveImages[activeIndex].url}
              alt={t("product_image_alt", { index: activeIndex + 1 })}
              fill
              className="object-cover object-center"
              priority
              sizes="50vw"
            />
          )}
        </div>
        {effectiveImages.length > 1 && (
          <div className="grid grid-cols-6 gap-2">
            {effectiveImages.map((img, index) => (
              <button
                key={img.id || index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "cursor-pointer rounded-xl border-2 p-0.5 overflow-hidden transition-all relative aspect-square bg-background",
                  activeIndex === index
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border/50 hover:border-border opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img.url}
                  alt={t("thumbnail_alt", { index: index + 1 })}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

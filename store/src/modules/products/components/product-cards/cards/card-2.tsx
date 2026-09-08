"use client"

import React, { useEffect, useRef, useState } from "react"
import { getPricesForVariant } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@modules/common/components/shadcn/button"

const hasPersian = (text?: string) =>
  text ? /[\u0600-\u06FF]/.test(text) : false

export default function MinimalProductCard({
  product,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) {
  const tHome = useTranslations("HomePage")
  const variant = product.variants?.[0]
  // Defer price formatting to client-side only to avoid SSR/client hydration mismatch.
  const [priceInfo, setPriceInfo] =
    useState<ReturnType<typeof getPricesForVariant>>(null)

  useEffect(() => {
    if (variant) setPriceInfo(getPricesForVariant(variant))
  }, [variant])

  const fullImageUrl = product.thumbnail ?? product.images?.[0]?.url ?? ""
  const cardRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = React.useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    const card = cardRef.current
    if (!card) return

    const touch = e.touches[0]
    const rect = card.getBoundingClientRect()
    const x = ((touch.clientX - rect.left) / rect.width) * 100
    const y = ((touch.clientY - rect.top) / rect.height) * 100

    card.style.setProperty("--reveal-x", `${String(x)}%`)
    card.style.setProperty("--reveal-y", `${String(y)}%`)
    setActive(true)
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    card.style.setProperty("--reveal-x", `${String(x)}%`)
    card.style.setProperty("--reveal-y", `${String(y)}%`)
    setActive(true)
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onTouchStart={handleTouchStart}
      className="group relative block w-full h-full bg-transparent overflow-hidden border border-border/30 hover:border-primary/50 transition-colors duration-700"
    >
      {/* Image Section */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
        {/* Background: Grayscale Image */}
        {fullImageUrl && (
          <Image
            src={fullImageUrl}
            alt={product.title}
            fill
            className="object-cover grayscale opacity-90 transition-all duration-1000 ease-out"
            sizes="(max-width: 768px) 100vw, 33vw"
            draggable={false}
          />
        )}

        {/* Foreground: Color Image (Clipped by circle) */}
        {fullImageUrl && (
          <div
            className="absolute inset-0 w-full h-full transition-all duration-1000 ease-out"
            style={{
              clipPath: `circle(${
                active ? "150%" : "0%"
              } at var(--reveal-x, 50%) var(--reveal-y, 50%))`,
              transition: "clip-path 2.8s cubic-bezier(0.15, 0.85, 0.35, 1)",
            }}
          >
            <Image
              src={fullImageUrl}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
              draggable={false}
            />
          </div>
        )}

        {/* Subtle dark gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

        {/* Custom Hover Action */}
        <div
          className={`absolute bottom-6 left-1/2 -translate-x-1/2 transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1) z-30 w-fit ${
            active
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          }`}
        >
          <LocalizedClientLink
            href={`/products/${product.handle}`}
            className="block"
          >
            <Button className="rounded-full shadow-xl text-[8px] sm:text-[10px] uppercase tracking-normal py-1.5 px-3 sm:py-3 sm:px-8 h-auto border-none">
              {tHome("view_details")}
            </Button>
          </LocalizedClientLink>
        </div>
      </div>

      {/* Typography Section */}
      <div className="flex flex-col items-center justify-center text-center p-3 sm:p-6 md:p-8 bg-transparent relative z-20">
        <span className="text-[8px] sm:text-[9px] text-muted-foreground uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-3 font-light">
          {product.collection?.title ?? "YOUR BRAND"}
        </span>

        <h3
          className={`text-xs sm:text-sm md:text-base uppercase font-normal text-foreground mb-2 sm:mb-4 w-full line-clamp-2 transition-colors duration-500 ${
            hasPersian(product.title) ? "tracking-normal" : "tracking-widest"
          }`}
        >
          {product.title}
        </h3>

        <div className="flex items-center gap-2 sm:gap-3">
          {priceInfo?.price_type === "sale" ? (
            <>
              <span className="line-through text-muted-foreground/50 text-[9px] sm:text-[10px]">
                {priceInfo.original_price}
              </span>
              <span className="text-[10px] sm:text-xs font-medium tracking-[0.1em] text-red-500">
                {priceInfo.calculated_price}
              </span>
            </>
          ) : (
            <span className="text-[10px] sm:text-xs font-light tracking-[0.1em] sm:tracking-[0.15em] text-foreground/80 group-hover:text-foreground transition-colors duration-500">
              {priceInfo?.calculated_price}
            </span>
          )}
        </div>
      </div>

      {/* Decorative Architectural Corners */}
      <div className="absolute top-0 left-0 w-8 h-[1px] bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
      <div className="absolute top-0 left-0 w-[1px] h-8 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
      <div className="absolute top-0 right-0 w-8 h-[1px] bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
      <div className="absolute top-0 right-0 w-[1px] h-8 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100"></div>
    </div>
  )
}

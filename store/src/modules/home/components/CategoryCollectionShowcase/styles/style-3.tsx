"use client"

import React, { useState } from "react"
import { HpSectionCategoryCollection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getMediaUrl } from "@lib/util/strapi-media"
import BlockHeader from "@modules/common/components/block-header"
import { ArrowUpRight } from "lucide-react"
import { Button } from "@modules/common/components/shadcn/button"
import { useTranslations } from "next-intl"

interface Style3Props {
  section: HpSectionCategoryCollection
}

export default function CategoryCollectionStyle3({ section }: Style3Props) {
  const t = useTranslations("HomePage")
  const { title, description, badge, textLink, linkUrl, items, headerStyle } =
    section
  const [activeIndex, setActiveIndex] = useState<number>(0)

  if (!items || items.length === 0) return null

  // Pre-process items for clean reading
  const parsedItems = items.map((item, index) => {
    const isCategory = item.__component === "category-collection.category-item"

    const fallbackTitle = isCategory
      ? item.category?.name
      : item.collection?.title
    const fallbackDescription = isCategory ? item.category?.description : ""
    const fallbackHandle = isCategory
      ? item.category?.medusaHandle
      : item.collection?.medusaHandle
    const fallbackLink =
      isCategory && fallbackHandle
        ? `/categories/${fallbackHandle}`
        : fallbackHandle
          ? `/collections/${fallbackHandle}`
          : "#"

    return {
      id: item.id || index,
      displayTitle: item.title || fallbackTitle || "Untitled",
      displayDescription: item.description || fallbackDescription,
      displayLink: item.link || fallbackLink,
      imageUrl: getMediaUrl(item.image?.[0]?.url),
      imageAlt:
        item.image?.[0]?.alternativeText ||
        item.title ||
        fallbackTitle ||
        "Untitled",
      type: isCategory ? "category" : "collection",
    }
  })

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Header ─────────────────────────────────────── */}
      <BlockHeader
        title={title}
        badge={badge}
        description={description}
        linkText={textLink}
        linkHref={linkUrl}
        style={headerStyle}
      />

      {/* ── Typographic Split View Layout ──────────────── */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left Side: Category List Menu (Interactive) */}
        <div className="lg:col-span-7 flex flex-col justify-center divide-y divide-border/60">
          {parsedItems.map((item, index) => {
            const isActive = index === activeIndex
            const indexLabel = String(index + 1).padStart(2, "0")

            return (
              <div
                key={item.id}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                className="group py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer transition-colors duration-300"
              >
                <div className="flex items-start gap-4 md:gap-6 flex-1">
                  {/* Number Indicator */}
                  <span
                    className={`
                    font-mono text-xs font-bold pt-1.5 transition-colors duration-300
                    ${isActive ? "text-primary" : "text-muted-foreground/40"}
                  `}
                  >
                    {indexLabel}
                  </span>

                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-3">
                      {/* Title */}
                      <h3
                        className={`
                        text-2xl md:text-3xl font-bold tracking-tight transition-all duration-300
                        ${isActive ? "text-foreground translate-x-2" : "text-muted-foreground group-hover:text-foreground/80"}
                      `}
                      >
                        {item.displayTitle}
                      </h3>
                      {/* Type Badge */}
                      <span
                        className={`
                        text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border
                        transition-all duration-300
                        ${isActive ? "border-primary/20 bg-primary/5 text-primary" : "border-border/60 text-muted-foreground/60"}
                      `}
                      >
                        {t(item.type as any)}
                      </span>
                    </div>

                    {/* Description & Inline Image/Link (reveals on active state) */}
                    <div
                      className={`
                      overflow-hidden transition-all duration-500 ease-in-out w-full
                      ${isActive ? "max-h-[400px] opacity-100 mt-2" : "max-h-0 opacity-0 pointer-events-none"}
                    `}
                    >
                      {item.displayDescription && (
                        <p className="text-sm text-muted-foreground/90 font-light max-w-xl leading-relaxed mb-4">
                          {item.displayDescription}
                        </p>
                      )}

                      {/* Mobile/Tablet inline image and link (appears when active on mobile) */}
                      <div className="block lg:hidden space-y-4">
                        <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-border/40 shadow-sm">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.imageAlt}
                              fill
                              className="object-cover animate-fade-in"
                              sizes="(max-width: 1024px) 100vw, 40vw"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-ui-bg-component to-ui-bg-subtle" />
                          )}
                        </div>

                        <LocalizedClientLink
                          href={item.displayLink}
                          className="inline-block w-fit"
                        >
                          <Button className="rounded-xl px-5 py-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider h-auto">
                            {t("explore")}
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </LocalizedClientLink>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explore button on right side (Desktop only) */}
                <div className="hidden lg:flex items-center">
                  <LocalizedClientLink
                    href={item.displayLink}
                    className={`
                      inline-flex items-center justify-center w-11 h-11 rounded-full border
                      transition-all duration-500
                      ${isActive ? "bg-foreground border-foreground text-background scale-110" : "border-border text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2"}
                    `}
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right Side: Showcase Feature Image (Desktop only) */}
        <div className="hidden lg:block lg:col-span-5 relative min-h-[450px] rounded-3xl overflow-hidden shadow-[0_15px_40px_-15px_rgba(0,0,0,0.15)] bg-muted/10">
          {/* Animated Ambient Blur Shadow */}
          <div className="absolute inset-0 z-0 bg-primary/5 filter blur-3xl rounded-full scale-75 animate-pulse duration-1000" />

          {/* Preloaded Images showing according to active index */}
          {parsedItems.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <div
                key={`img-${item.id}`}
                className={`
                  absolute inset-0 transition-all duration-700 ease-out
                  ${isActive ? "opacity-100 scale-100 z-10 pointer-events-auto" : "opacity-0 scale-95 z-0 pointer-events-none"}
                `}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority={index === 0}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ui-bg-component to-ui-bg-subtle" />
                )}

                {/* Vignette Layer */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Floating Explore badge */}
                <div className="absolute bottom-6 right-6">
                  <LocalizedClientLink
                    href={item.displayLink}
                    className="block"
                  >
                    <Button className="flex items-center gap-2 px-5 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-auto">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {t("explore")}
                      </span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>
                  </LocalizedClientLink>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

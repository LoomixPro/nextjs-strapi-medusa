"use client"

import React, { useState } from "react"
import { HpSectionCategoryCollection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getMediaUrl } from "@lib/util/strapi-media"
import BlockHeader from "@modules/common/components/block-header"
import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"

interface Style2Props {
  section: HpSectionCategoryCollection
}

export default function CategoryCollectionStyle2({ section }: Style2Props) {
  const t = useTranslations("HomePage")
  const { title, description, badge, textLink, linkUrl, items, headerStyle } =
    section
  const [hoveredIndex, setHoveredIndex] = useState<number>(0)

  if (!items || items.length === 0) return null

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

      {/* ── Interactive Accordion Showcase ────────────── */}
      <div className="mt-8 flex flex-col md:flex-row w-full gap-3 md:gap-4 h-auto md:h-[540px] min-h-[400px]">
        {items.map((item, index) => {
          const isCategory =
            item.__component === "category-collection.category-item"

          const fallbackTitle = isCategory
            ? item.category?.name
            : item.collection?.title
          const fallbackDescription = isCategory
            ? item.category?.description
            : ""
          const fallbackHandle = isCategory
            ? item.category?.medusaHandle
            : item.collection?.medusaHandle
          const fallbackLink =
            isCategory && fallbackHandle
              ? `/categories/${fallbackHandle}`
              : fallbackHandle
                ? `/collections/${fallbackHandle}`
                : "#"

          const displayTitle = item.title || fallbackTitle || "Untitled"
          const displayDescription = item.description || fallbackDescription
          const displayLink = item.link || fallbackLink
          const imageUrl = getMediaUrl(item.image?.[0]?.url)

          const isHovered = hoveredIndex === index
          const indexLabel = String(index + 1).padStart(2, "0")

          return (
            <div
              key={`${item.__component}-${item.id || index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => setHoveredIndex(index)}
              className={`
                group relative overflow-hidden rounded-3xl border cursor-pointer select-none
                transition-all duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                w-full md:w-auto h-[360px] md:h-full
                ${
                  isHovered
                    ? "md:flex-[3.5] border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/15"
                    : "md:flex-[1] border-border/40 hover:border-white/20 opacity-85 md:opacity-70 hover:opacity-100"
                }
              `}
            >
              {/* Background Image */}
              <div className="absolute inset-0 z-0">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={item.image?.[0]?.alternativeText || displayTitle}
                    fill
                    priority={index === 0}
                    className={`
                      object-cover transition-all duration-700 ease-out
                      ${
                        isHovered
                          ? "scale-105 grayscale-0 opacity-100"
                          : "scale-100 grayscale-[30%] opacity-70 md:opacity-50"
                      }
                    `}
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-ui-bg-component to-ui-bg-subtle" />
                )}

                {/* Dark Multi-layer Gradient Overlay */}
                <div
                  className={`
                    absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 via-40% to-black/15
                    transition-opacity duration-700
                    ${isHovered ? "opacity-95" : "opacity-85 md:opacity-75"}
                  `}
                />
              </div>

              {/* Index label / Type Indicator Pill */}
              <div className="absolute top-5 left-5 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-sm">
                <span className="font-mono text-xs font-bold text-white/90 tracking-wider">
                  {indexLabel}
                </span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {isCategory ? t("category") : t("collection")}
                </span>
              </div>

              {/* Card Content Wrapper (Expanded state) */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8 z-10 overflow-hidden">
                <div className="w-full max-w-lg min-w-[260px]">
                  {/* Title */}
                  <h3
                    className={`
                      text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-2.5
                      transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                      ${
                        isHovered
                          ? "opacity-100 translate-y-0 delay-150"
                          : "md:opacity-0 md:translate-y-6 delay-0"
                      }
                    `}
                  >
                    {displayTitle}
                  </h3>

                  {/* Description */}
                  {displayDescription && (
                    <p
                      className={`
                        text-sm text-white/75 line-clamp-3 mb-5 max-w-md font-light leading-relaxed
                        transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                        ${
                          isHovered
                            ? "opacity-100 translate-y-0 delay-200"
                            : "md:opacity-0 md:translate-y-6 delay-0"
                        }
                      `}
                    >
                      {displayDescription}
                    </p>
                  )}

                  {/* Minimalist CTA Link */}
                  <div
                    className={`
                      transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                      ${
                        isHovered
                          ? "opacity-100 translate-y-0 delay-250 pointer-events-auto"
                          : "md:opacity-0 md:translate-y-6 delay-0 md:pointer-events-none"
                      }
                    `}
                  >
                    <LocalizedClientLink
                      href={displayLink}
                      className="group/link inline-flex items-center gap-3 text-xs md:text-sm font-semibold text-white/90 hover:text-white transition-colors duration-300"
                    >
                      <span className="relative py-0.5 tracking-wide">
                        {t("explore")}
                        <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-white/60 scale-x-0 group-hover/link:scale-x-100 transition-transform origin-right duration-300" />
                      </span>
                      <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all duration-300 group-hover/link:bg-white group-hover/link:text-black group-hover/link:border-white group-hover/link:shadow-lg group-hover/link:scale-105">
                        <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover/link:-translate-x-0.5" />
                      </div>
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>

              {/* Vertical Title (Visible when collapsed on desktop) */}
              <div
                className={`
                  hidden md:flex flex-col items-center justify-end pb-8 absolute inset-0 z-10 pointer-events-none
                  transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]
                  ${
                    isHovered
                      ? "opacity-0 translate-y-4 pointer-events-none delay-0"
                      : "opacity-100 translate-y-0 delay-200"
                  }
                `}
              >
                <div className="[writing-mode:vertical-rl] rotate-180 flex items-center gap-3">
                  <span className="text-base font-bold text-white/80 tracking-widest uppercase whitespace-nowrap drop-shadow-sm">
                    {displayTitle}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

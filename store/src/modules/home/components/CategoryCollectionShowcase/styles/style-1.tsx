import React from "react"
import { HpSectionCategoryCollection } from "@lib/data/homepage"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Image from "next/image"
import { getMediaUrl } from "@lib/util/strapi-media"
import { GlowCard } from "@modules/common/components/glow-card"
import BlockHeader from "@modules/common/components/block-header"
import { useTranslations } from "next-intl"

interface Style1Props {
  section: HpSectionCategoryCollection
}

const GLOW_COLORS: ("blue" | "purple" | "green" | "red" | "orange")[] = [
  "purple",
  "blue",
  "green",
  "orange",
  "red",
]

// Bento grid col/row spans indexed by position
function getGridSpan(index: number, total: number) {
  if (total === 1) return { col: "md:col-span-12", row: "md:row-span-2" }

  if (total === 2) {
    return index === 0
      ? { col: "md:col-span-6", row: "md:row-span-2" }
      : { col: "md:col-span-6", row: "md:row-span-2" }
  }

  if (total === 3) {
    if (index === 0) return { col: "md:col-span-7", row: "md:row-span-2" }
    // index 1 & 2 stack in the right 5-col column
    return { col: "md:col-span-5", row: "md:row-span-1" }
  }

  if (total === 4) {
    if (index === 0) return { col: "md:col-span-7", row: "md:row-span-2" }
    if (index === 1) return { col: "md:col-span-5", row: "md:row-span-1" }
    if (index === 2) return { col: "md:col-span-5", row: "md:row-span-1" }
    // 4th card: starts a new row, spans full 12 cols as a wide banner
    return { col: "md:col-span-12", row: "md:row-span-1" }
  }

  // 5 items: featured + 2 stacked right + 2 equal in bottom row
  if (total === 5) {
    if (index === 0) return { col: "md:col-span-7", row: "md:row-span-2" }
    if (index === 1) return { col: "md:col-span-5", row: "md:row-span-1" }
    if (index === 2) return { col: "md:col-span-5", row: "md:row-span-1" }
    // items 4 & 5 → new row, split in half
    return { col: "md:col-span-6", row: "md:row-span-1" }
  }

  // 6 items: featured + 2 stacked right + 3 equal thirds in bottom row
  if (total === 6) {
    if (index === 0) return { col: "md:col-span-7", row: "md:row-span-2" }
    if (index === 1) return { col: "md:col-span-5", row: "md:row-span-1" }
    if (index === 2) return { col: "md:col-span-5", row: "md:row-span-1" }
    // items 4, 5, 6 → new row in equal thirds
    return { col: "md:col-span-4", row: "md:row-span-1" }
  }

  // 7+ fallback: featured + 2 stacked right, rest in cols-4
  if (index === 0) return { col: "md:col-span-7", row: "md:row-span-2" }
  if (index === 1) return { col: "md:col-span-5", row: "md:row-span-1" }
  if (index === 2) return { col: "md:col-span-5", row: "md:row-span-1" }
  return { col: "md:col-span-4", row: "md:row-span-1" }
}

export default function CategoryCollectionStyle1({ section }: Style1Props) {
  const t = useTranslations("HomePage")
  const { title, description, badge, textLink, linkUrl, items, headerStyle } =
    section

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      {/* ── Header ─────────────────────────────────────── */}
      <BlockHeader
        title={title}
        badge={badge}
        description={description}
        linkText={textLink}
        linkHref={linkUrl}
        style={headerStyle}
      />

      {/* ── Bento Grid ─────────────────────────────────── */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:auto-rows-[260px]">
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

            const { col, row } = getGridSpan(index, items.length)
            const glowColor = GLOW_COLORS[index % GLOW_COLORS.length]
            const indexLabel = String(index + 1).padStart(2, "0")
            const isFeatured = index === 0 && items.length > 1

            return (
              <GlowCard
                key={`${item.__component}-${item.id || index}`}
                as={LocalizedClientLink}
                href={displayLink}
                glowColor={glowColor}
                customSize={true}
                className={`
                  group relative w-full
                  ${col} ${row}
                  ${isFeatured ? "min-h-[420px] md:min-h-0" : "min-h-[260px] md:min-h-0"}
                  focus:outline-none focus:ring-2 focus:ring-ui-border-interactive focus:ring-offset-2
                `}
              >
                {/* ── Background Image ── */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.image?.[0]?.alternativeText || displayTitle}
                      fill
                      priority={index === 0 || isFeatured}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 58vw, 42vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-ui-bg-component to-ui-bg-subtle" />
                  )}

                  {/* Multi-layer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/5 transition-all duration-500 group-hover:from-black/90 group-hover:via-black/40" />
                  {/* Side vignette for depth */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
                </div>

                {/* ── Index number ── */}
                <div className="absolute top-5 left-5 z-10 flex items-center gap-2.5">
                  <span className="font-mono text-[10px] font-bold text-white/25 tracking-[0.2em]">
                    {indexLabel}
                  </span>
                  <div className="h-px w-5 bg-white/20 transition-all duration-500 group-hover:w-8 group-hover:bg-white/40" />
                </div>

                {/* ── Category type badge ── */}
                <div className="absolute top-5 right-5 z-10">
                  <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] text-white/40 transition-colors duration-300 group-hover:text-white/70">
                    {isCategory ? t("category") : t("collection")}
                  </span>
                </div>

                {/* ── Content ── */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
                  {/* Title */}
                  <h3
                    className={`font-black tracking-tight text-white leading-[1.1] mb-2 transition-transform duration-500 group-hover:-translate-y-1 ${
                      isFeatured
                        ? "text-3xl md:text-4xl"
                        : "text-xl md:text-2xl"
                    }`}
                  >
                    {displayTitle}
                  </h3>

                  {/* Description — reveals on hover */}
                  {displayDescription && (
                    <p
                      className="text-sm text-white/60 line-clamp-2 mb-3 max-w-sm
                      opacity-0 translate-y-2
                      group-hover:opacity-100 group-hover:translate-y-0
                      transition-all duration-400 ease-out"
                    >
                      {displayDescription}
                    </p>
                  )}

                  {/* CTA */}
                  <div
                    className="flex items-center gap-2.5
                    opacity-0 translate-y-3
                    group-hover:opacity-100 group-hover:translate-y-0
                    transition-all duration-400 ease-out delay-75"
                  >
                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white">
                      {t("explore")}
                    </span>
                    <div className="w-5 h-5 rounded-full border border-white/50 flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M7 17L17 7M17 7H7M17 7v10"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* ── Shimmer line at bottom ── */}
                <div
                  className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent
                  scale-x-0 group-hover:scale-x-100 transition-transform duration-700 ease-out rounded-full"
                />
              </GlowCard>
            )
          })}
        </div>
      ) : (
        <div className="py-20 text-center text-ui-fg-subtle border-2 border-dashed border-ui-border-base rounded-2xl">
          No items found to display.
        </div>
      )}
    </div>
  )
}

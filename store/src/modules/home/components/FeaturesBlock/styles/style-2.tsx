import React from "react"
import FeatureIcon from "./FeatureIcon"
import BlockHeader from "@modules/common/components/block-header"
import type { FeatureItem } from "@lib/data/homepage"

export interface FeaturesStyleProps {
  title?: string
  badge?: string
  description?: string
  headerStyle?: string
  features: FeatureItem[]
}

export default function Style2({
  title,
  badge,
  description,
  headerStyle,
  features,
}: FeaturesStyleProps) {
  const hasHeader = Boolean(title || badge || description)

  return (
    <section className="w-full py-10 sm:py-14 overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="content-container">
        {hasHeader && (
          <div className="mb-10 sm:mb-14">
            <BlockHeader
              title={title}
              badge={badge}
              description={description}
              style={headerStyle || "style-1"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, idx) => (
            <div
              key={feature.id || idx}
              className="group relative flex flex-col items-center text-center p-7 sm:p-8 rounded-3xl bg-card/60 dark:bg-card/40 backdrop-blur-md border border-border/60 hover:border-primary/40 shadow-xs hover:shadow-2xl hover:shadow-primary/15 transition-all duration-500 overflow-hidden hover:-translate-y-2"
            >
              {/* Top Gradient Highlight Strip */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Radial Hover Glow */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

              {/* Top Index Badge */}
              <div className="absolute top-4 right-4 sm:top-5 sm:right-5 text-[11px] font-bold tracking-widest text-muted-foreground/40 group-hover:text-primary/70 transition-colors duration-300">
                {String(idx + 1).padStart(2, "0")}
              </div>

              {/* Icon Container */}
              <div className="relative mb-6 flex-shrink-0">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 scale-110" />
                <div className="relative flex items-center justify-center w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-background via-muted/50 to-muted/80 group-hover:from-primary group-hover:to-primary/90 text-primary group-hover:text-primary-foreground border border-border/80 group-hover:border-primary/30 shadow-md group-hover:shadow-lg group-hover:shadow-primary/25 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <FeatureIcon
                    feature={feature}
                    iconSize={30}
                    className="transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 relative z-10 flex flex-col items-center">
                <h3 className="font-bold text-base sm:text-lg mb-2.5 text-foreground group-hover:text-primary transition-colors duration-300 leading-snug">
                  {feature.title}
                </h3>
                {feature.description && (
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground group-hover:text-muted-foreground/90 transition-colors duration-300">
                    {feature.description}
                  </p>
                )}
              </div>

              {/* Bottom Hover Line Pill */}
              <div className="mt-6 w-8 h-1 rounded-full bg-border group-hover:w-16 group-hover:bg-primary transition-all duration-500" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

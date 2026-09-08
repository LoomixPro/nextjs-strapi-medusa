import React from "react"
import FeatureIcon from "./FeatureIcon"
import BlockHeader from "@modules/common/components/block-header"

export default function Style1({
  title,
  badge,
  description,
  headerStyle,
  features,
}: FeaturesStyleProps) {
  const hasHeader = Boolean(title || badge || description)

  return (
    <section className="w-full py-6 overflow-hidden">
      <div className="content-container">
        {hasHeader && (
          <div className="mb-8">
            <BlockHeader
              title={title}
              badge={badge}
              description={description}
              style={headerStyle || "style-1"}
            />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="group relative flex flex-row items-center p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border/80 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 overflow-hidden -translate-y-0 hover:-translate-y-1.5 transition-all duration-300 ease-out"
            >
              {/* Radial Glow Blob */}
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-bl from-primary/15 via-accent/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Icon Container */}
              <div className="relative flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 me-4 sm:me-5 bg-secondary/80 group-hover:bg-primary text-primary group-hover:text-primary-foreground rounded-xl sm:rounded-2xl border border-border/60 group-hover:border-primary/20 shadow-xs group-hover:scale-105 transition-all duration-300 z-10">
                <FeatureIcon
                  feature={feature}
                  iconSize={24}
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Text Area */}
              <div className="flex-1 text-start relative z-10 min-w-0">
                <h3 className="font-bold text-sm sm:text-base mb-1 text-card-foreground group-hover:text-primary transition-colors duration-300 truncate">
                  {feature.title}
                </h3>
                {feature.description && (
                  <p className="text-xs sm:text-[13px] leading-relaxed text-muted-foreground line-clamp-2">
                    {feature.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

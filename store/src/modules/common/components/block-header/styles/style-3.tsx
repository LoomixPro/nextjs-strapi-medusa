"use client"

import React from "react"
import { ArrowLeft } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ShinyText from "@modules/common/components/ShinyText"

interface BlockHeaderStyleProps {
  title?: string
  /** Short badge label shown above the title (replaces old 'subtitle') */
  badge?: string
  description?: string
  linkText?: string
  linkHref?: string
  badgeIcon?: React.ReactNode
}

export default function BlockHeaderStyle3({
  title,
  badge,
  description,
  linkText,
  linkHref,
  badgeIcon,
}: BlockHeaderStyleProps) {
  const hasContent = title || badge || description || (linkText && linkHref)
  if (!hasContent) return null

  return (
    <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/40">
      {/* Start Column: Title and Badge with a vertical accent bar */}
      <div className="flex gap-4 items-start max-w-xl">
        {/* Thick vertical gradient bar on the start side */}
        <div className="w-[5px] self-stretch rounded-full bg-gradient-to-b from-primary via-primary/60 to-transparent flex-shrink-0" />

        <div className="flex flex-col gap-2">
          {/* Flat Monospace Badge */}
          {badge && (
            <span className="text-[10px] font-mono font-bold tracking-widest text-primary/60 uppercase select-none flex items-center gap-1.5">
              {badgeIcon && <span className="opacity-80">{badgeIcon}</span>}
              {"// "}
              {badge}
            </span>
          )}

          {/* Title */}
          {title && (
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-none text-start">
              <ShinyText
                text={title}
                disabled={false}
                speed={3}
                className="inline-block"
                color="currentColor"
                shineColor="hsl(var(--primary))"
              />
            </h2>
          )}
        </div>
      </div>

      {/* End Column: Description & CTA Link */}
      {(description || (linkText && linkHref)) && (
        <div className="flex flex-col gap-3 md:items-start max-w-md">
          {description && (
            <p className="text-sm text-muted-foreground/85 font-light leading-relaxed text-start">
              {description}
            </p>
          )}

          {linkText && linkHref && (
            <LocalizedClientLink
              href={linkHref}
              className="relative w-fit inline-flex items-center gap-1 text-xs font-bold text-primary group py-1"
            >
              <span>{linkText}</span>
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform duration-300" />
              {/* Sliding underline animation */}
              <span className="absolute bottom-0 start-0 w-0 h-[1.5px] bg-primary group-hover:w-full transition-all duration-300" />
            </LocalizedClientLink>
          )}
        </div>
      )}
    </div>
  )
}

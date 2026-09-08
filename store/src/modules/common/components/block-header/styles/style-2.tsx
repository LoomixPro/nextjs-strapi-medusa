"use client"

import React from "react"
import { ArrowLeft, Sparkles } from "lucide-react"
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

export default function BlockHeaderStyle2({
  title,
  badge,
  description,
  linkText,
  linkHref,
}: BlockHeaderStyleProps) {
  const hasContent = title || badge || description || (linkText && linkHref)
  if (!hasContent) return null

  return (
    <div className="mb-12 flex flex-col items-center text-center gap-4">
      {/* Badge: Centered, rounded, with premium gradient and pulse effect */}
      {badge && (
        <div className="relative group inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/10 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-md transition-all duration-300 hover:border-primary/20 hover:scale-105 select-none w-fit">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/45 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary/70"></span>
          </span>
          <span className="text-[10px] font-black tracking-widest uppercase text-primary/80">
            {badge}
          </span>
        </div>
      )}

      {/* Title + Underline accent */}
      {title && (
        <div className="relative group flex flex-col items-center gap-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            <ShinyText
              text={title}
              disabled={false}
              speed={3}
              className="inline-block"
              color="currentColor"
              shineColor="hsl(var(--primary))"
            />
          </h2>
          {/* Animated decorative center bar */}
          <div className="h-[3px] w-12 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent transition-all duration-500 group-hover:w-24 group-hover:opacity-90" />
        </div>
      )}

      {/* Description: Centered max width with soft color */}
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground/80 font-normal max-w-2xl leading-relaxed text-center mt-1">
          {description}
        </p>
      )}

      {/* Link: Rendered as a sleek pills/button styling at the bottom */}
      {linkText && linkHref && (
        <div className="mt-2">
          <LocalizedClientLink
            href={linkHref}
            className="group inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-primary hover:text-primary-foreground border border-primary/20 bg-background/50 hover:bg-primary rounded-full transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
          >
            <span>{linkText}</span>
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 rtl:group-hover:-translate-x-1.5 ltr:group-hover:translate-x-1.5 transition-transform duration-300" />
          </LocalizedClientLink>
        </div>
      )}
    </div>
  )
}

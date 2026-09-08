"use client"

import React from "react"
import { ArrowLeft } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface BlockFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  badge?: string
  description?: string
  buttonText?: string
  buttonLink?: string
}

const BlockFooter = React.forwardRef<HTMLDivElement, BlockFooterProps>(
  (
    { title, badge, description, buttonText, buttonLink, className, ...props },
    ref
  ) => {
    const hasContent =
      title || badge || description || (buttonText && buttonLink)
    if (!hasContent) return null

    return (
      <div
        ref={ref}
        className={`w-full max-w-5xl mx-auto px-6 pt-3 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-t border-border/40 ${
          className || ""
        }`}
        {...props}
      >
        {/* Start side: Badge + (Title & Description) */}
        <div className="flex items-center gap-4 text-start">
          {/* Dark square/rounded badge matching reference image */}
          {badge && (
            <div className="min-w-[48px] h-12 px-3.5 bg-foreground text-background flex items-center justify-center font-bold rounded-2xl text-sm sm:text-base select-none flex-shrink-0 shadow-sm">
              {badge}
            </div>
          )}

          {/* Text layout (Title + Description) */}
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground/80 font-light leading-normal">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* End side: CTA Button */}
        {buttonText && buttonLink && buttonLink !== "#" && (
          <div className="flex-shrink-0 self-end sm:self-auto">
            <LocalizedClientLink
              href={buttonLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 transition-opacity group"
            >
              <span>{buttonText}</span>
              <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform duration-200" />
            </LocalizedClientLink>
          </div>
        )}
      </div>
    )
  }
)

BlockFooter.displayName = "BlockFooter"

export default BlockFooter

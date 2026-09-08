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

export default function BlockHeaderStyle1({
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
    <div className="mb-10 flex flex-col gap-3">
      {/* Badge + Title row (above separator) */}
      <div className="flex flex-col items-start gap-3 pb-3.5 border-b border-border">
        {/* Badge */}
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 w-fit">
            {badgeIcon && (
              <span className="flex-shrink-0 opacity-80">{badgeIcon}</span>
            )}
            <span className="text-[10px] font-black tracking-widest uppercase text-primary/70 select-none">
              {badge}
            </span>
          </div>
        )}

        {/* Title */}
        {title && (
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight text-start">
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

      {/* Description + Link (below separator) */}
      {(description || (linkText && linkHref)) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-0.5">
          <div className="text-start flex-1">
            {description && (
              <p className="text-sm text-muted-foreground font-light max-w-xl">
                {description}
              </p>
            )}
          </div>

          {linkText && linkHref && (
            <div className="flex justify-start sm:justify-end flex-shrink-0">
              <LocalizedClientLink
                href={linkHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-70 transition-opacity group"
              >
                <span>{linkText}</span>
                <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform duration-200" />
              </LocalizedClientLink>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

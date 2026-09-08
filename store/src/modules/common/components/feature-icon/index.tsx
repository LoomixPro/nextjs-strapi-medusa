import React from "react"
import Image from "next/image"
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headset,
  CreditCard,
  Award,
  Percent,
  Zap,
  HelpCircle,
} from "lucide-react"
import { cn } from "@lib/utils"
import type { FeatureItem } from "@lib/data/homepage"

export interface FeatureIconProps {
  feature?: FeatureItem
  iconName?: string | null
  iconUrl?: string | null
  alt?: string
  color?:
    "emerald" | "primary" | "amber" | "blue" | "purple" | "rose" | string | null
  iconSize?: number
  className?: string
}

const COLOR_MAP: Record<string, { text: string; dot: string }> = {
  emerald: { text: "text-emerald-500", dot: "bg-emerald-500" },
  primary: { text: "text-primary", dot: "bg-primary" },
  amber: { text: "text-amber-500", dot: "bg-amber-500" },
  blue: { text: "text-blue-500", dot: "bg-blue-500" },
  purple: { text: "text-purple-500", dot: "bg-purple-500" },
  rose: { text: "text-rose-500", dot: "bg-rose-500" },
}

/**
 * Universal helper to render feature & highlight icons consistently
 * across Hero, FeaturesBlock, and other storefront modules.
 */
export function getFeatureIcon({
  feature,
  iconName,
  iconUrl,
  alt,
  color,
  iconSize = 16,
  className,
}: FeatureIconProps) {
  // 1. Resolve image url from feature or explicit prop
  const resolvedUrl = iconUrl || feature?.icon?.url
  const resolvedAlt =
    alt || feature?.icon?.alternativeText || feature?.title || "Feature icon"

  if (resolvedUrl) {
    return (
      <Image
        src={resolvedUrl}
        alt={resolvedAlt}
        width={iconSize}
        height={iconSize}
        className={cn("object-contain drop-shadow-sm shrink-0", className)}
      />
    )
  }

  // 2. Resolve icon name from explicit prop or feature
  const resolvedIconName = iconName || feature?.icon_name

  const colorConfig = color ? COLOR_MAP[color] : null
  const textColor = colorConfig ? colorConfig.text : ""
  const dotColor = colorConfig ? colorConfig.dot : "bg-primary"

  const iconClasses = cn("shrink-0", textColor, className)

  switch (resolvedIconName) {
    case "truck":
      return <Truck size={iconSize} className={iconClasses} />
    case "shield-check":
      return <ShieldCheck size={iconSize} className={iconClasses} />
    case "rotate-ccw":
      return <RotateCcw size={iconSize} className={iconClasses} />
    case "headset":
      return <Headset size={iconSize} className={iconClasses} />
    case "credit-card":
      return <CreditCard size={iconSize} className={iconClasses} />
    case "award":
      return <Award size={iconSize} className={iconClasses} />
    case "percent":
      return <Percent size={iconSize} className={iconClasses} />
    case "zap":
      return <Zap size={iconSize} className={iconClasses} />
    case "dot":
      return (
        <span
          className={cn("w-2 h-2 rounded-full shrink-0", dotColor, className)}
        />
      )
    default:
      if (color) {
        return (
          <span
            className={cn("w-2 h-2 rounded-full shrink-0", dotColor, className)}
          />
        )
      }
      return <HelpCircle size={iconSize} className={iconClasses} />
  }
}

export default function FeatureIcon(props: FeatureIconProps) {
  return getFeatureIcon(props)
}

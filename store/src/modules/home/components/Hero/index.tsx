import React from "react"
import { STYLES } from "./registry"
import { HttpTypes } from "@medusajs/types"
import type { HeroSection } from "@lib/data/homepage"

export interface HeroBlockProps {
  section?: HeroSection | null
  heroProducts?: HttpTypes.StoreProduct[]
  region?: HttpTypes.StoreRegion
}

export default async function HeroStage({
  section,
  heroProducts = [],
  region,
}: HeroBlockProps) {
  const formattedStyle = section?.style
    ? section.style
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    : "style-1"

  const DynamicComponent = STYLES[formattedStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  return (
    <DynamicComponent
      section={section}
      heroProducts={heroProducts}
      region={region}
    />
  )
}

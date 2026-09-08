import { STYLES } from "./registry"
import type { FeaturesBlock as FeaturesBlockType } from "@lib/data/homepage"

export interface FeaturesBlockProps {
  block: FeaturesBlockType
}

export default async function FeaturesBlock({ block }: FeaturesBlockProps) {
  const section = block.features_section
  if (!section) return null

  const { contentType, style, features, testimonials } = section

  const isTestimonial = contentType === "testimonials"

  // Check if content exists
  if (isTestimonial) {
    if (!testimonials || testimonials.length === 0) return null
  } else {
    if (!features || features.length === 0) return null
  }

  const formattedStyle = style
    ? style
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
    : isTestimonial
      ? "style-3"
      : "style-1"

  const targetStyle =
    isTestimonial && formattedStyle === "style-1" ? "style-3" : formattedStyle

  const DynamicComponent = STYLES[targetStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  if (isTestimonial) {
    return (
      <DynamicComponent
        title={section.title}
        badge={section.badge}
        description={section.description}
        headerStyle={section.headerStyle}
        testimonials={testimonials}
      />
    )
  }

  return (
    <DynamicComponent
      title={section.title}
      badge={section.badge}
      description={section.description}
      headerStyle={section.headerStyle}
      features={features}
    />
  )
}

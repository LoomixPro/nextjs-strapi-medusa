import React from "react"
import { HomepageBlock } from "@lib/data/homepage"
import { HttpTypes } from "@medusajs/types"
import ProductScrollBlock from "./ProductScrollBlock"
import HeroBlockRenderer from "./HeroBlock"
import ProductShowcaseBlock from "./ProductShowcaseBlock"
import FeaturesBlock from "./FeaturesBlock"
import BlogPostsBlock from "./BlogPostsBlock"
import CategoryCollectionShowcase from "../CategoryCollectionShowcase"
import BlockAnimateWrapper from "./BlockAnimateWrapper"

interface BlockRendererProps {
  block: HomepageBlock
  region: HttpTypes.StoreRegion
  countryCode: string
  index: number
  isLast?: boolean
}

export default async function BlockRenderer({
  block,
  region,
  countryCode,
  index,
  isLast,
}: BlockRendererProps) {
  let BlockContent: React.ReactNode = null

  switch (block.__component) {
    case "ui.product-scroll-block":
      BlockContent = (
        <ProductScrollBlock
          block={block}
          region={region}
          countryCode={countryCode}
          index={index}
        />
      )
      break
    case "ui.hero-block":
      BlockContent = (
        <HeroBlockRenderer
          block={block}
          index={index}
          region={region}
          countryCode={countryCode}
        />
      )
      break
    case "ui.product-showcase-block":
      BlockContent = (
        <ProductShowcaseBlock
          block={block}
          region={region}
          countryCode={countryCode}
          index={index}
        />
      )
      break
    case "ui.features-block":
      BlockContent = <FeaturesBlock block={block} />
      break
    case "ui.blog-posts-block":
      BlockContent = <BlogPostsBlock block={block} />
      break
    case "ui.category-collection-block":
      BlockContent = <CategoryCollectionShowcase block={block} />
      break
    default:
      console.warn(
        `[BlockRenderer] Unknown block component type: ${
          (block as any).__component
        }`
      )
      return null
  }

  return (
    <BlockAnimateWrapper index={index} isLast={isLast}>
      {BlockContent}
    </BlockAnimateWrapper>
  )
}

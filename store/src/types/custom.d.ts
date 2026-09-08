import {
  FeatureItem,
  HeroSection,
  SplitBannerSection,
} from "@lib/data/homepage"
import { HttpTypes } from "@medusajs/types"

declare global {
  interface SplitBannerStageProps {
    banner: SplitBannerSection
  }

  interface HeroBlockProps {
    section: HeroSection
  }

  interface FeaturesStyleProps {
    title?: string
    badge?: string
    description?: string
    headerStyle?: string
    features: FeatureItem[]
  }

  interface ScrollStageProps {
    products?: HttpTypes.StoreProduct[]
    region?: HttpTypes.StoreRegion
    title?: string
    badge?: string
    description?: string
    buttonText?: string
    buttonLink?: string
    style?: string
    headerStyle?: string
    cardStyle?: string
    image?: {
      url: string
      alternativeText?: string
      width?: number
      height?: number
    }
  }

  interface ProductShowcaseProps {
    title?: string
    badge?: string
    description?: string
    type?: "trending" | "discount" | "campaign"
    style?: string
    headerStyle?: string
    cardStyle?: string
    products?: HttpTypes.StoreProduct[]
    region?: HttpTypes.StoreRegion
    endsAt?: string
    promoCode?: string
    campaignId?: string
  }

  interface BlogBlockProps {
    title?: string
    badge?: string
    description?: string
    headerStyle?: string
    posts: BlogPost[]
  }

  interface BlogPostBlock {
    type: "text" | "image" | "video" | "image-text-split" | "ad" | "heading"
    content?: string
    imageUrl?: string
    imageAlt?: string
    videoUrl?: string
    title?: string
    align?: "left" | "right"
    caption?: string // used for image caption
    adCode?: string
    adLink?: string
    adButtonText?: string
  }

  interface BlogPost {
    id: string
    title: string
    excerpt: string
    featured: boolean
    coverImage: string
    locale: "en" | "fa"
    author: {
      name: string
      avatar: string
    }
    publishedAt: string // Strapi standard timestamp
    readTime: string
    category: string
    blocks: BlogPostBlock[]
    views?: number
  }

  interface ProductTemplateProps {
    product: HttpTypes.StoreProduct
    region: HttpTypes.StoreRegion
    countryCode: string
    images: HttpTypes.StoreProductImage[]
  }
}

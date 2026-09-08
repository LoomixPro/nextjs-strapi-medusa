"use server"
import { cacheLife, cacheTag } from "next/cache"
import { getLocale } from "@lib/data/locale-actions"
import { fetchWithRetry } from "@lib/util/fetch-retry"
import { getStrapiServerUrl } from "@lib/util/server-urls"

const STRAPI_URL = getStrapiServerUrl()
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export interface StrapiProductRelation {
  id: number
  documentId: string
  medusaId: string
  title: string
}

export interface ProductScrollSection {
  id: number
  documentId: string
  title: string
  badge?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  style: string
  headerStyle?: string
  cardStyle?: string
  products: StrapiProductRelation[]
  image?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }
}

export interface HeroHighlight {
  id?: number
  text: string
  color?: "emerald" | "primary" | "amber" | "blue" | "purple" | "rose" | string
  icon_name?: string
}

export interface HeroSection {
  id: number
  documentId: string
  title: string
  badge?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  style: string
  mainImages?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }[]
  sideImages?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }[]
  highlights?: HeroHighlight[]
  products?: {
    medusaId: string
    title?: string
    subtitle?: string
  }[]
}

export type SplitBannerSection = HeroSection

export interface ProductScrollBlock {
  __component: "ui.product-scroll-block"
  id: number
  section: ProductScrollSection | null
}

export interface HeroBlock {
  __component: "ui.hero-block"
  id: number
  section: HeroSection | null
}

export interface StrapiSourceComponent {
  __component:
    | "showcase.collection"
    | "showcase.category"
    | "showcase.all-items"
    | "showcase.campaign"
    | "showcase.custom"
  filterBy?: "most_visited" | "discounted"
  collection?: { medusaId: string }
  category?: { medusaId: string }
  campaign?: { medusaId: string; endsAt?: string }
  products?: { medusaId: string }[]
}

export interface ProductShowcaseData {
  documentId: string
  title: string
  badge?: string
  description?: string
  productCount: number
  style?: string
  headerStyle?: string
  cardStyle?: string
  source: "all" | "collection" | "category" | "campaign" | "custom"
  collection?: StrapiSourceComponent
  category?: StrapiSourceComponent
  campaign?: StrapiSourceComponent
  custom?: StrapiSourceComponent
  all?: StrapiSourceComponent
}

export interface ProductShowcaseBlock {
  __component: "ui.product-showcase-block"
  id: number
  showcase: ProductShowcaseData | null
}

export interface FeatureItem {
  id: number
  title: string
  description?: string
  icon?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }
  icon_name?:
    | "truck"
    | "shield-check"
    | "rotate-ccw"
    | "headset"
    | "credit-card"
    | "award"
    | "percent"
    | "zap"
    | null
}

export interface TestimonialItem {
  id: number
  author_name: string
  author_role?: string
  content: string
  rating?: number
  avatar?: {
    url: string
    alternativeText?: string
    width?: number
    height?: number
  }
}

export interface FeaturesSection {
  documentId: string
  contentType?: "features" | "testimonials"
  title?: string
  badge?: string
  description?: string
  headerStyle?: string
  style: string
  features?: FeatureItem[]
  testimonials?: TestimonialItem[]
}

export interface FeaturesBlock {
  __component: "ui.features-block"
  id: number
  features_section: FeaturesSection | null
}

export interface BlogSection {
  id: number
  documentId: string
  title?: string
  badge?: string
  description?: string
  source: "manual" | "latest" | "views"
  postCount: number
  style: string
  headerStyle?: string
  posts?: BlogPost[]
}

export interface BlogPostsBlock {
  __component: "ui.blog-posts-block"
  id: number
  blog_section: BlogSection | null
}

export interface CategoryItem {
  __component: "category-collection.category-item"
  id: number
  category?: {
    medusaId: string
    name: string
    description: string
    medusaHandle: string
  }
  image?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }[]
  title?: string
  description?: string
  link?: string
}

export interface CollectionItem {
  __component: "category-collection.collection-item"
  id: number
  collection?: { medusaId: string; title: string; medusaHandle: string }
  image?: {
    url: string
    alternativeText: string
    width: number
    height: number
  }[]
  title?: string
  description?: string
  link?: string
}

export interface HpSectionCategoryCollection {
  documentId: string
  title?: string
  description?: string
  badge?: string
  textLink?: string
  linkUrl?: "/collections" | "/categories"
  style: string
  headerStyle?: string
  items: (CategoryItem | CollectionItem)[]
}

export interface CategoryCollectionBlock {
  __component: "ui.category-collection-block"
  id: number
  section: HpSectionCategoryCollection | null
}

export type HomepageBlock =
  | ProductScrollBlock
  | HeroBlock
  | ProductShowcaseBlock
  | FeaturesBlock
  | BlogPostsBlock
  | CategoryCollectionBlock

export interface HomepageData {
  id: number
  documentId: string
  blocks: HomepageBlock[]
}

/**
 * Map Next.js locale/countryCode to Strapi locale
 */
export async function getStrapLocale(locale?: string | null): Promise<string> {
  if (!locale || locale === "default") {
    return process.env.DEFAULT_LOCALE || "en-US"
  }
  return locale
}

/**
 * Fetch homepage data from Strapi CMS
 */
export const getHomepageData = async (
  status: "draft" | "published" = "published"
): Promise<HomepageData | null> => {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)

  if (status === "draft") {
    return _fetchHomepageData(status, strapiLocale)
  }
  return _cachedHomepageData(status, strapiLocale)
}

async function _cachedHomepageData(
  status: "draft" | "published",
  strapiLocale: string
): Promise<HomepageData | null> {
  "use cache"
  cacheTag("strapi-homepage", `strapi-homepage-${strapiLocale}`)

  try {
    const data = await _fetchHomepageData(status, strapiLocale)
    cacheLife("days")
    return data
  } catch (error) {
    cacheLife("minutes")
    return null
  }
}

async function _fetchHomepageData(
  status: "draft" | "published",
  strapiLocale: string
): Promise<HomepageData | null> {
  const response = await fetchWithRetry(
    `${STRAPI_URL}/api/homepage?locale=${strapiLocale}&status=${status}`,
    {
      headers: {
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    }
  )

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Strapi homepage fetch failed: ${response.status}`)
  }

  const { data } = await response.json()
  return data
}

"use server"

import { cacheTag } from "next/cache"
import { getLocale } from "@lib/data/locale-actions"
import { getStrapLocale } from "./homepage"
import { getMediaUrl } from "@lib/util/strapi-media"
import { getStrapiServerUrl } from "@lib/util/server-urls"
import { fetchWithRetry } from "@lib/util/fetch-retry"

const STRAPI_URL = getStrapiServerUrl()
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

// Maps Strapi v5 JSON response data to unified BlogPost interface
function mapStrapiPostToBlogPost(post: any): BlogPost {
  return {
    id: post.documentId || String(post.id),
    title: post.title || "",
    excerpt: post.excerpt || "",
    featured: !!post.featured,
    coverImage:
      getMediaUrl(post.coverImage) ||
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
    locale: post.locale || "en",
    author: {
      name: post.author?.name || "Author",
      avatar:
        getMediaUrl(post.author?.avatar) ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
    },
    publishedAt: post.publishedAt || post.createdAt || new Date().toISOString(),
    readTime: post.readTime || "5 min read",
    category: post.category?.slug || "general",
    blocks: (post.blocks || []).map((block: any) => {
      // Map Strapi's "__component" name (e.g., "blog.heading" to "heading")
      const type = block.__component
        ? block.__component.replace("blog.", "")
        : block.type

      // Build absolute URLs for media files nested in component blocks
      let imageUrl = ""
      if (block.image) {
        imageUrl = getMediaUrl(block.image) || ""
      }

      return {
        ...block,
        type,
        imageUrl,
      }
    }),
  }
}

async function fetchBlogPostsFromStrapi(
  strapiLocale: string
): Promise<BlogPost[]> {
  try {
    const query = new URLSearchParams({
      locale: strapiLocale,
      "populate[coverImage][populate]": "*",
      "populate[author][populate]": "*",
      "populate[category][populate]": "*",
      "populate[blocks][populate]": "*",
      sort: "publishedAt:desc",
    })

    const response = await fetchWithRetry(
      `${STRAPI_URL}/api/blog-posts?${query.toString()}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Strapi blog-posts fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    if (Array.isArray(data) && data.length > 0) {
      return data.map(mapStrapiPostToBlogPost)
    }
  } catch (err) {
    console.warn(
      "Strapi fetch failed or returned empty. Returning empty array. Error:",
      err
    )
  }

  return []
}

/**
 * Fetch blog posts for sitemap generation without "use cache".
 */
export async function getBlogPostsForSitemap(): Promise<BlogPost[]> {
  const strapiLocale = await getStrapLocale("default")
  return fetchBlogPostsFromStrapi(strapiLocale)
}

/**
 * Fetch all blog posts from Strapi CMS (with fallback to mock data)
 */
export async function getBlogPosts(
  options: { isStatic?: boolean } = {}
): Promise<BlogPost[]> {
  const currentLocale = options.isStatic
    ? "default"
    : (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getBlogPostsCached(strapiLocale)
}

async function getBlogPostsCached(strapiLocale: string): Promise<BlogPost[]> {
  "use cache"
  cacheTag(`strapi-blog-posts-${strapiLocale}`, "strapi-blog")
  return fetchBlogPostsFromStrapi(strapiLocale)
}

/**
 * Fetch single blog post by its documentId or Slug from Strapi CMS (with fallback to mock data)
 */
export async function getBlogPostById(
  idOrSlug: string
): Promise<BlogPost | null> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getBlogPostByIdCached(idOrSlug, strapiLocale)
}

async function getBlogPostByIdCached(
  idOrSlug: string,
  strapiLocale: string
): Promise<BlogPost | null> {
  "use cache"
  try {
    // 1. Try fetching by documentId first
    const query = new URLSearchParams({
      "populate[coverImage][populate]": "*",
      "populate[author][populate]": "*",
      "populate[category][populate]": "*",
      "populate[blocks][populate]": "*",
    })

    const docResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/blog-posts/${idOrSlug}?${query.toString()}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(`strapi-blog-post-${idOrSlug}`, "strapi-blog")

    if (docResponse.ok) {
      const { data } = await docResponse.json()
      if (data) {
        return mapStrapiPostToBlogPost(data)
      }
    }

    // 2. If documentId fetch fails, try querying by Slug filter
    const slugQuery = new URLSearchParams({
      "filters[slug][$eq]": idOrSlug,
      locale: strapiLocale,
      "populate[coverImage][populate]": "*",
      "populate[author][populate]": "*",
      "populate[category][populate]": "*",
      "populate[blocks][populate]": "*",
    })

    const slugResponse = await fetchWithRetry(
      `${STRAPI_URL}/api/blog-posts?${slugQuery.toString()}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(`strapi-blog-post-slug-${idOrSlug}`, "strapi-blog")

    if (slugResponse.ok) {
      const { data } = await slugResponse.json()
      if (Array.isArray(data) && data.length > 0) {
        return mapStrapiPostToBlogPost(data[0])
      }
    }
  } catch (err) {
    console.warn(
      `Strapi fetch for post "${idOrSlug}" failed. Returning null. Error:`,
      err
    )
  }

  return null
}

/**
 * Fetch all blog categories from Strapi CMS (with fallback to mock data)
 */
export async function getBlogCategories(): Promise<
  { id: string; name: string }[]
> {
  const currentLocale = (await getLocale()) || "default"
  const strapiLocale = await getStrapLocale(currentLocale)
  return getBlogCategoriesCached(strapiLocale)
}

async function getBlogCategoriesCached(
  strapiLocale: string
): Promise<{ id: string; name: string }[]> {
  "use cache"
  try {
    const query = new URLSearchParams({
      locale: strapiLocale,
    })

    const response = await fetchWithRetry(
      `${STRAPI_URL}/api/blog-categories?${query.toString()}`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )
    cacheTag(`strapi-blog-categories-${strapiLocale}`, "strapi-blog")

    if (!response.ok) {
      throw new Error(`Strapi blog-categories fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    if (Array.isArray(data)) {
      return data.map((cat: any) => ({
        id: cat.slug || cat.documentId || String(cat.id),
        name: cat.name || cat.slug || "Category",
      }))
    }
  } catch (err) {
    console.warn(
      "Strapi categories fetch failed. Returning empty array. Error:",
      err
    )
  }

  return []
}

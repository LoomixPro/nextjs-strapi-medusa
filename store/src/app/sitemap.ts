import { MetadataRoute } from "next"
import { connection } from "next/server"
import { listProducts } from "@lib/data/products"
import { getBlogPostsForSitemap } from "@lib/data/blog"
import { listRegions } from "@lib/data/regions"
import { getBaseURL } from "@lib/util/env"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()

  const settings = await getStorefrontSettings()
  if (settings.allowIndexing === false) {
    return []
  }

  const baseUrl = getBaseURL()

  let countryCodes: string[] = []
  try {
    const regions = await listRegions(true)
    if (regions?.length) {
      const fetchedCodes = regions
        .flatMap((r) => r.countries?.map((c) => c.iso_2?.toLowerCase()))
        .filter(Boolean) as string[]
      if (fetchedCodes.length) {
        countryCodes = Array.from(new Set(fetchedCodes))
      }
    }
  } catch (error) {
    console.error(
      "Sitemap generator: Failed to fetch regions from Medusa:",
      error
    )
  }

  if (countryCodes.length === 0) {
    return []
  }

  const defaultCountry = countryCodes[0]

  const staticRoutes = [
    "",
    "/store",
    "/blog",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/faq",
  ]

  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add static routes for each country code
  for (const country of countryCodes) {
    for (const route of staticRoutes) {
      sitemapEntries.push({
        url: `${baseUrl}/${country}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
      })
    }
  }

  // Add Medusa Products
  try {
    const { response } = await listProducts({
      countryCode: defaultCountry,
      queryParams: { limit: 200, fields: "handle,updated_at" },
      disableAuth: true,
    })

    if (response.products?.length) {
      for (const product of response.products) {
        if (product.handle) {
          for (const country of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${country}/products/${product.handle}`,
              lastModified: product.updated_at
                ? new Date(product.updated_at)
                : new Date(),
              changeFrequency: "weekly",
              priority: 0.9,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error("Sitemap generator: Failed to fetch products:", error)
  }

  // Add Strapi Blog Posts
  try {
    const blogPosts = await getBlogPostsForSitemap()
    if (blogPosts?.length) {
      for (const post of blogPosts) {
        if (post.id) {
          for (const country of countryCodes) {
            sitemapEntries.push({
              url: `${baseUrl}/${country}/blog/${post.id}`,
              lastModified: post.publishedAt
                ? new Date(post.publishedAt)
                : new Date(),
              changeFrequency: "monthly",
              priority: 0.7,
            })
          }
        }
      }
    }
  } catch (error) {
    console.error("Sitemap generator: Failed to fetch blog posts:", error)
  }

  return sitemapEntries
}

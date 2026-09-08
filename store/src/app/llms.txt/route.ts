import { getBaseURL } from "@lib/util/env"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"

export const dynamic = "force-dynamic"

export async function GET() {
  const rawBaseUrl = getBaseURL()
  const baseUrl = rawBaseUrl.replace(/\/+$/, "")

  let siteName = "Online Store"
  let siteDescription =
    "A modern e-commerce store powered by Medusa v2 and Next.js."

  try {
    const settings = await getStorefrontSettings()
    if (settings?.siteName?.trim()) {
      siteName = settings.siteName.trim()
    }
    if (settings?.siteDescription?.trim()) {
      siteDescription = settings.siteDescription.trim()
    } else if (settings?.storePage?.description?.trim()) {
      siteDescription = settings.storePage.description.trim()
    }
  } catch {
    // Graceful fallback if Strapi is not yet reachable
  }

  // Fetch live categories and collections from Medusa
  const [categories, collectionsResult] = await Promise.all([
    listCategories({ limit: 15 }, { isStatic: true }).catch(() => []),
    listCollections({ limit: "15" }, { isStatic: true }).catch(() => ({
      collections: [],
      count: 0,
    })),
  ])

  const collections = collectionsResult?.collections || []

  // Core navigation sections
  const sections: string[] = [
    `# ${siteName}`,
    `> ${siteDescription}`,
    `## Main Navigation`,
    `- [Home](${baseUrl}): Featured highlights, newest arrivals, and promotions.`,
    `- [Store Catalog](${baseUrl}/store): Browse all available products with filters and search.`,
    `- [Cart](${baseUrl}/cart): Shopping bag and checkout.`,
    `- [Customer Account](${baseUrl}/account): Customer profile, order history, and addresses.`,
    `- [About Us](${baseUrl}/about): Learn more about our store and brand.`,
    `- [Contact Support](${baseUrl}/contact): Contact details, support hours, and inquiry form.`,
    `- [FAQ](${baseUrl}/faq): Frequently asked questions and help guide.`,
  ]

  // Add Dynamic Categories if configured in Medusa
  if (categories && categories.length > 0) {
    const categoryLinks = categories
      .filter((c) => Boolean(c.handle && c.name))
      .map(
        (c) =>
          `- [${c.name}](${baseUrl}/categories/${c.handle}): ${c.description || `Browse ${c.name}`}`
      )

    if (categoryLinks.length > 0) {
      sections.push(`## Product Categories\n\n${categoryLinks.join("\n")}`)
    }
  }

  // Add Dynamic Collections if configured in Medusa
  if (collections && collections.length > 0) {
    const collectionLinks = collections
      .filter((c) => Boolean(c.handle && c.title))
      .map((c) => `- [${c.title}](${baseUrl}/collections/${c.handle})`)

    if (collectionLinks.length > 0) {
      sections.push(`## Featured Collections\n\n${collectionLinks.join("\n")}`)
    }
  }

  // Store policies and trust pages
  sections.push(
    `## Policies & Customer Care\n\n` +
      `- [Privacy Policy](${baseUrl}/privacy): Privacy policy and data handling information.\n` +
      `- [Terms of Service](${baseUrl}/terms): Terms, conditions, and store guidelines.\n` +
      `- [Returns Policy](${baseUrl}/returns): Return conditions, warranty, and refund instructions.`
  )

  // Technology Stack
  sections.push(
    `## Technology Stack\n\n` +
      `- Built with Next.js App Router, Medusa v2 E-Commerce engine, and Strapi CMS.`
  )

  const content = sections.join("\n\n") + "\n"

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}

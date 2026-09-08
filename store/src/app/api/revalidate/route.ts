import crypto from "node:crypto"
import { revalidatePath, revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

// Helper function for timing-safe secret validation
function isValidSecret(providedSecret: string | null): boolean {
  if (!providedSecret || !process.env.REVALIDATE_SECRET) {
    return false
  }
  const actual = new Uint8Array(
    crypto.createHash("sha256").update(providedSecret).digest()
  )
  const expected = new Uint8Array(
    crypto.createHash("sha256").update(process.env.REVALIDATE_SECRET).digest()
  )
  return crypto.timingSafeEqual(actual, expected)
}

/**
 * Revalidation Route (Supports both paths and tags, plus Strapi Webhooks)
 *
 * - paths: Array of URL paths to revalidate (e.g., ["/ir/categories/shoes"])
 * - tags: Array of cache tags to revalidate (e.g., ["categories", "category-products"])
 */
export async function POST(request: NextRequest) {
  const secret =
    request.headers.get("x-strapi-secret") ||
    request.nextUrl.searchParams.get("secret")

  if (!isValidSecret(secret)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  let paths: string[] = []
  let tags: string[] = []

  // Get paths and tags from Body
  try {
    const body = await request.json()

    if (body.paths && Array.isArray(body.paths)) {
      paths = body.paths
    }
    if (body.tags && Array.isArray(body.tags)) {
      tags = body.tags
    }

    // --- STRAPI WEBHOOK SUPPORT ---
    // If the request comes from a Strapi Webhook, it will have an 'event' and 'model'
    if (
      body.event &&
      body.event.startsWith("entry.") &&
      body.model &&
      body.entry
    ) {
      const locale = body.entry.locale || "en" // Default fallback locale
      // Map Strapi model names to our Next.js cache tags
      const modelToTagMap: Record<string, string> = {
        "about-page": "about",
        "faq-page": "faq",
        "contact-page": "contact",
        "privacy-page": "privacy",
        "terms-page": "terms",
        "size-guide-page": "size-guide",
        "returns-page": "returns",
      }

      if (
        body.model === "storefront-setting" ||
        body.model === "storefront-settings"
      ) {
        tags.push("strapi-settings", "translation-messages")
      } else if (
        body.model === "homepage" ||
        body.model === "api::homepage.homepage" ||
        body.model.startsWith("hp-") ||
        body.model.startsWith("api::hp-")
      ) {
        tags.push("strapi-homepage")
        if (locale) tags.push(`strapi-homepage-${locale}`)
      } else if (body.model === "navigation" || body.model === "menu") {
        tags.push("navigation", "menu")
      } else if (body.model === "dictionary-entry") {
        tags.push(
          "strapi-dictionary",
          "strapi-settings",
          "translation-messages"
        )
      } else if (
        body.model === "blog-post" ||
        body.model === "blog-category" ||
        body.model === "api::blog-post.blog-post" ||
        body.model === "api::blog-category.blog-category"
      ) {
        tags.push("strapi-blog")
        if (locale) {
          tags.push(`strapi-blog-posts-${locale}`)
          tags.push(`strapi-blog-categories-${locale}`)
        }
      }

      const tagPrefix = modelToTagMap[body.model]
      if (tagPrefix) {
        tags.push(`strapi-${tagPrefix}-${locale}`, `strapi-${tagPrefix}`)
      } else if (
        !body.model.startsWith("hp-") &&
        !body.model.startsWith("api::hp-") &&
        body.model !== "homepage" &&
        body.model !== "navigation" &&
        body.model !== "dictionary-entry" &&
        body.model !== "blog-post" &&
        body.model !== "blog-category" &&
        body.model !== "storefront-setting" &&
        body.model !== "storefront-settings"
      ) {
        // If we don't have a specific mapping, revalidate all strapi pages just in case
        tags.push("strapi-pages")
      }
    }
    // ------------------------------
  } catch (e) {
    // No body or invalid JSON
  }

  if (paths.length === 0 && tags.length === 0) {
    return NextResponse.json(
      { message: "No paths or tags provided" },
      { status: 400 }
    )
  }

  // Revalidate paths
  await Promise.all(
    paths.map(async (path) => {
      revalidatePath(path)
    })
  )

  // Revalidate tags
  await Promise.all(
    tags.map(async (tag) => {
      if (tag) {
        revalidateTag(tag, "max")
      }
    })
  )

  return NextResponse.json({
    revalidated: true,
    processedPaths: paths,
    processedTags: tags,
    now: Date.now(),
  })
}

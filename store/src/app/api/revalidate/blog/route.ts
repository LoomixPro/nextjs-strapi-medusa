// app/api/revalidate/blog/route.ts
import crypto from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextRequest } from "next/server"

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

export async function POST(req: NextRequest) {
  try {
    const secret =
      req.headers.get("x-strapi-secret") ||
      new URL(req.url).searchParams.get("secret")

    if (!isValidSecret(secret)) {
      return new Response(JSON.stringify({ message: "Invalid secret" }), {
        status: 401,
      })
    }

    const payload = await req.json()
    const event = payload?.event
    const uid = payload?.model || payload?.uid // Webhook payload usually has model, lifecycle has uid
    const entry = payload?.entry
    const locale = entry?.locale
    const documentId = entry?.documentId
    const slug = entry?.slug

    // "blog-post" or "blog-category" comes from the model property in webhook
    if (
      uid === "blog-post" ||
      uid === "blog-category" ||
      uid === "api::blog-post.blog-post" ||
      uid === "api::blog-category.blog-category"
    ) {
      // Revalidate the general blog tag we added
      const tagsToRevalidate = ["strapi-blog"]

      // Revalidate locale-specific lists
      if (locale) {
        tagsToRevalidate.push(`strapi-blog-posts-${locale}`)
        tagsToRevalidate.push(`strapi-blog-categories-${locale}`)
      } else {
        tagsToRevalidate.push(
          `strapi-blog-posts-fa-IR`,
          `strapi-blog-posts-en-US`
        )
        tagsToRevalidate.push(
          `strapi-blog-categories-fa-IR`,
          `strapi-blog-categories-en-US`
        )
        tagsToRevalidate.push(`strapi-blog-posts-fa`, `strapi-blog-posts-en`)
        tagsToRevalidate.push(
          `strapi-blog-categories-fa`,
          `strapi-blog-categories-en`
        )
      }

      // If it's a specific post, revalidate its specific tags
      if (uid === "blog-post" || uid === "api::blog-post.blog-post") {
        if (documentId) {
          tagsToRevalidate.push(`strapi-blog-post-${documentId}`)
        }
        if (slug) {
          tagsToRevalidate.push(`strapi-blog-post-slug-${slug}`)
        }
      }

      for (const tag of tagsToRevalidate) {
        revalidateTag(tag, "max")
      }
    }

    return Response.json({
      revalidated: true,
      event,
      uid,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("❌ Blog webhook error:", err)
    return new Response(
      JSON.stringify({
        error: "Error revalidating blog",
        details: err.message,
      }),
      { status: 500 }
    )
  }
}

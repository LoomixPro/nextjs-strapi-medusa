// app/api/preview/route.ts
// Strapi Preview API handler - based on official Strapi v5 docs:
// https://docs.strapi.io/cms/features/preview
//
// Flow:
// 1. User clicks "Preview" in Strapi admin panel
// 2. Strapi calls the handler in config/admin.ts which builds a URL like:
//    http://localhost:8000/api/preview?secret=...&uid=...&documentId=...&locale=...&status=...
// 3. This route validates the secret, enables Next.js Draft Mode, and redirects to the homepage
// 4. The homepage (or any page) can now check draftMode() to show draft content

import crypto from "node:crypto"
import { cookies, draftMode } from "next/headers"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  // 1. Validate the secret token sent by Strapi using REVALIDATE_SECRET
  const secret = searchParams.get("secret")
  const expectedSecret = process.env.REVALIDATE_SECRET

  if (!secret || !expectedSecret) {
    return new Response(JSON.stringify({ message: "Invalid preview secret" }), {
      status: 401,
    })
  }

  const actual = new Uint8Array(
    crypto.createHash("sha256").update(secret).digest()
  )
  const expected = new Uint8Array(
    crypto.createHash("sha256").update(expectedSecret).digest()
  )
  if (!crypto.timingSafeEqual(actual, expected)) {
    return new Response(JSON.stringify({ message: "Invalid preview secret" }), {
      status: 401,
    })
  }

  // 2. Extract Strapi params
  const uid = searchParams.get("uid") // e.g. "api::hp-section-hero.hp-section-hero"
  const documentId = searchParams.get("documentId")
  const locale = searchParams.get("locale")
  const status = searchParams.get("status") ?? "draft"

  // 3. Toggle Next.js Draft Mode based on requested status
  const draft = await draftMode()
  if (status === "draft" || status === "modified") {
    draft.enable()
  } else {
    draft.disable()
  }

  // 4. Set locale cookie if sent by Strapi so the preview renders in the editor's active language
  if (locale) {
    const cookieStore = await cookies()
    cookieStore.set("_medusa_locale", locale, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  // 5. Determine target countryCode and page path
  const countryCode = (
    process.env.DEFAULT_REGION ||
    process.env.NEXT_PUBLIC_DEFAULT_REGION ||
    "us"
  ).toLowerCase()

  let targetPath = ""
  if (uid?.startsWith("api::hp-section-") || uid === "api::homepage.homepage") {
    targetPath = ""
  } else if (uid === "api::about-page.about-page") {
    targetPath = "/about"
  } else if (uid === "api::contact-page.contact-page") {
    targetPath = "/contact"
  } else if (uid === "api::faq-page.faq-page") {
    targetPath = "/faq"
  } else if (uid === "api::terms-page.terms-page") {
    targetPath = "/terms"
  } else if (uid === "api::privacy-page.privacy-page") {
    targetPath = "/privacy"
  } else if (uid === "api::returns-page.returns-page") {
    targetPath = "/returns"
  } else if (uid === "api::size-guide-page.size-guide-page") {
    targetPath = "/size-guide"
  } else if (uid === "api::blog-post.blog-post") {
    targetPath = documentId ? `/blog/${documentId}` : "/blog"
  }

  const redirectUrl = `/${countryCode}${targetPath}?preview=true`

  // 6. Redirect to the target page with draft mode enabled
  redirect(redirectUrl)
}

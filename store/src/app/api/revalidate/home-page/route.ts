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
    const uid = payload?.model || payload?.uid

    if (
      uid?.startsWith("api::hp-") ||
      uid?.startsWith("hp-") ||
      uid === "api::homepage.homepage" ||
      uid === "homepage"
    ) {
      // Dynamically clear all locales for homepage by using the generic tag
      revalidateTag("strapi-homepage", "max")
    }

    return Response.json({
      revalidated: true,
      event,
      uid,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("❌ Webhook error:", err)
    return new Response(
      JSON.stringify({ error: "Error revalidating", details: err.message }),
      { status: 500 }
    )
  }
}

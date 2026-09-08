import crypto from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

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

export async function POST(request: NextRequest) {
  const secret =
    request.headers.get("x-strapi-secret") ||
    request.nextUrl.searchParams.get("secret")

  if (!isValidSecret(secret)) {
    return new Response(JSON.stringify({ message: "Invalid secret" }), {
      status: 401,
    })
  }

  try {
    // Get body from webhook
    const body = await request.json()
    // Check if event is related to storefront-setting or dictionary-entry
    if (
      body.model == "storefront-setting" ||
      body.model == "dictionary-entry"
    ) {
      revalidateTag("strapi-settings", "max")
      revalidateTag("strapi-dictionary", "max")
      revalidateTag("translation-messages", "max")
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
    })
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) },
      { status: 500 }
    )
  }
}

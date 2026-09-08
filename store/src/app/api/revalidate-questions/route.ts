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
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
  }

  try {
    const { products } = await request.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { message: "Missing or invalid products array" },
        { status: 400 }
      )
    }

    // Revalidate the store product questions cache for each product
    for (const productId of products) {
      revalidateTag(`product-questions-${productId}`, "max")
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      products,
    })
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating questions cache", error: String(err) },
      { status: 500 }
    )
  }
}

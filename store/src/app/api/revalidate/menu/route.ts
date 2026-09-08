import crypto from "node:crypto"
import { revalidateTag } from "next/cache"
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

export async function POST(req: NextRequest) {
  try {
    const secret =
      req.headers.get("x-strapi-secret") ||
      req.nextUrl.searchParams.get("secret")

    if (!isValidSecret(secret)) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }

    revalidateTag("navigation", "max")
    revalidateTag("menu", "max")

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("❌ Webhook error:", err)
    return NextResponse.json(
      { error: "Error revalidating", details: err.message },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const secret = req.nextUrl.searchParams.get("secret")

    if (!isValidSecret(secret)) {
      return NextResponse.json({ message: "Invalid secret" }, { status: 401 })
    }

    revalidateTag("navigation", "max")
    revalidateTag("menu", "max")

    return NextResponse.json({
      revalidated: true,
      timestamp: new Date().toISOString(),
      message: "Menu revalidated successfully manually",
    })
  } catch (err: any) {
    console.error("❌ Manual revalidation error:", err)
    return NextResponse.json(
      { error: "Error revalidating", details: err.message },
      { status: 500 }
    )
  }
}

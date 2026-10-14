import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import installedStylesMap from "@/lib/config/installed-styles.json"

function safeCompareSecret(
  provided?: string | null,
  expected?: string | null
): boolean {
  if (!provided || !expected) {
    return false
  }

  const actual = new Uint8Array(
    crypto.createHash("sha256").update(provided).digest()
  )
  const expectedHash = new Uint8Array(
    crypto.createHash("sha256").update(expected).digest()
  )

  if (actual.length !== expectedHash.length) {
    return false
  }

  return crypto.timingSafeEqual(actual, expectedHash)
}

export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production"
  const internalSecret = process.env.INTERNAL_API_SECRET
  const providedSecret =
    request.headers.get("x-internal-secret") ||
    request.nextUrl.searchParams.get("secret")

  if (
    !isDev &&
    (!internalSecret || !safeCompareSecret(providedSecret, internalSecret))
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const component = request.nextUrl.searchParams.get("component")
  if (component) {
    const styles =
      (installedStylesMap as Record<string, string[]>)[component] || []
    return NextResponse.json({
      success: true,
      component,
      installed: styles,
    })
  }

  return NextResponse.json({
    success: true,
    installedMap: installedStylesMap,
  })
}

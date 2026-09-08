import { NextRequest, NextResponse } from "next/server"
import installedStylesMap from "@/lib/config/installed-styles.json"

export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production"
  const internalSecret = process.env.INTERNAL_API_SECRET
  const providedSecret =
    request.headers.get("x-internal-secret") ||
    request.nextUrl.searchParams.get("secret")

  if (!isDev && internalSecret && providedSecret !== internalSecret) {
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

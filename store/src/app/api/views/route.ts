import { NextResponse } from "next/server"
import { connection } from "next/server"
import { getUmamiViewCount, getUmamiViewMap } from "@lib/data/umami-views"
import { rateLimit } from "@lib/util/rate-limiter"

export async function GET(request: Request) {
  await connection()

  const forwardedFor = request.headers.get("x-forwarded-for")
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown-ip"

  const limitCheck = await rateLimit(`views:${ip}`, {
    maxAttempts: 30,
    windowMs: 60 * 1000,
  })

  if (!limitCheck.allowed) {
    return NextResponse.json({ views: {} }, { status: 429 })
  }

  const handle = new URL(request.url).searchParams.get("handle")

  try {
    if (handle) {
      const views = await getUmamiViewCount(handle)
      return NextResponse.json({ views })
    }

    const views = await getUmamiViewMap()
    return NextResponse.json({ views })
  } catch (error) {
    console.error("Umami Views API Error:", error)
    return NextResponse.json({ views: handle ? 0 : {} })
  }
}

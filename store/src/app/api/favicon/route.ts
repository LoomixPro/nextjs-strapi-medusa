import { NextRequest, NextResponse } from "next/server"
import sharp from "sharp"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { getStrapiServerUrl } from "@lib/util/server-urls"
import fs from "fs"
import path from "path"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sizeParam = searchParams.get("size")
  const parsedSize = parseInt(sizeParam || "32", 10)
  const size = Math.min(Math.max(isNaN(parsedSize) ? 32 : parsedSize, 16), 1024)

  try {
    const settings = await getStorefrontSettings()
    let imageBuffer: Buffer | null = null

    // 1. Try to fetch custom favicon from Strapi
    if (settings.favicon?.url) {
      try {
        const strapiUrl = getStrapiServerUrl()
        const fileUrl = settings.favicon.url.startsWith("http")
          ? settings.favicon.url
          : `${strapiUrl}${settings.favicon.url}`

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(fileUrl, {
          signal: controller.signal,
          headers: {
            Accept: "image/*",
          },
        })
        clearTimeout(timeoutId)

        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer()
          imageBuffer = Buffer.from(arrayBuffer)
        }
      } catch (fetchErr) {
        console.warn(
          "[Favicon Route] Failed to fetch custom favicon from Strapi, falling back to local icon:",
          fetchErr
        )
      }
    }

    // 2. Fallback to local high-res icon or favicon
    if (!imageBuffer) {
      const fallbackPng = path.join(
        process.cwd(),
        "public",
        "icons",
        "icon-512x512.png"
      )
      if (fs.existsSync(fallbackPng)) {
        imageBuffer = await fs.promises.readFile(fallbackPng)
      } else {
        const fallbackIco = path.join(process.cwd(), "public", "favicon.ico")
        if (fs.existsSync(fallbackIco)) {
          imageBuffer = await fs.promises.readFile(fallbackIco)
        }
      }
    }

    if (!imageBuffer) {
      return new NextResponse(null, { status: 404 })
    }

    // 3. Process and resize with sharp
    const resizedBuffer = await sharp(imageBuffer)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({
        quality: 90,
        compressionLevel: 9,
      })
      .toBuffer()

    return new NextResponse(new Uint8Array(resizedBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    })
  } catch (error) {
    console.error("[Favicon Route] Error generating favicon:", error)
    return new NextResponse(null, { status: 500 })
  }
}

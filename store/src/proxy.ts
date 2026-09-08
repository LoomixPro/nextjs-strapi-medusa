import { HttpTypes } from "@medusajs/types"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || "us"

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now(),
}

/**
 * Retrieves the region map from the Medusa backend.
 * Caches the result in memory for 1 hour to optimize performance.
 *
 * @param cacheId - The unique cache identifier
 * @returns A Map containing region data keyed by country ISO codes
 */
async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache

  if (!BACKEND_URL) {
    console.warn(
      "Proxy.ts: MEDUSA_BACKEND_URL environment variable is not defined."
    )
    return regionMapCache.regionMap
  }

  if (
    !regionMap.keys().next().value ||
    regionMapUpdated < Date.now() - 3600 * 1000
  ) {
    try {
      const response = await fetch(`${BACKEND_URL}/store/regions`, {
        headers: {
          "x-publishable-api-key": PUBLISHABLE_API_KEY || "",
        },
        next: {
          revalidate: 3600,
          tags: [`regions-${cacheId}`],
        },
        cache: "force-cache",
      })

      if (!response.ok) {
        console.error(
          `Proxy.ts: Failed to fetch regions: ${response.statusText}`
        )
        return regionMapCache.regionMap
      }

      const json = await response.json()
      const regions = json.regions

      if (regions?.length) {
        regions.forEach((region: HttpTypes.StoreRegion) => {
          region.countries?.forEach((c) => {
            regionMapCache.regionMap.set(c.iso_2 ?? "", region)
          })
        })
        regionMapCache.regionMapUpdated = Date.now()
      }
    } catch (error) {
      console.error(
        "Proxy.ts: Network error while fetching regions from Medusa backend:",
        error
      )
      // Fallback: If regionMap is empty and fetch failed (e.g. backend unreachable), insert default region map
      if (!regionMapCache.regionMap.has(DEFAULT_REGION.toLowerCase())) {
        regionMapCache.regionMap.set(DEFAULT_REGION.toLowerCase(), {
          id: "reg_default",
          name: "Default Region",
          currency_code: "usd",
          countries: [{ iso_2: DEFAULT_REGION.toLowerCase(), name: "Default" }],
        } as any)
      }
    }
  }

  return regionMapCache.regionMap
}

/**
 * Fetches regions from Medusa and sets the region cookie.
 * @param request
 * @param response
 */
async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode

    const vercelCountryCode = request.headers
      .get("x-vercel-ip-country")
      ?.toLowerCase()

    const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode
    } else if (regionMap.has(DEFAULT_REGION.toLowerCase())) {
      countryCode = DEFAULT_REGION.toLowerCase()
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value
    }

    return countryCode
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Proxy.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL."
      )
    }
  }
}

/**
 * Main Proxy function to handle region selection, localization, and onboarding status.
 * It intercepts requests and redirects users to the correct region-specific URL based on their IP or URL path.
 *
 * @param request - The incoming Next.js request
 * @returns A NextResponse object, either a redirect or a pass-through
 */
export async function proxy(request: NextRequest) {
  let redirectUrl = request.nextUrl.href

  let response = NextResponse.next()

  let cacheIdCookie = request.cookies.get("_medusa_cache_id")

  let cacheId = cacheIdCookie?.value || crypto.randomUUID()

  const regionMap = await getRegionMap(cacheId)

  const countryCode = regionMap && (await getCountryCode(request, regionMap))

  const urlCountryCode = request.nextUrl.pathname.split("/")[1]?.toLowerCase()
  const urlHasCountryCode = Boolean(
    countryCode && urlCountryCode === countryCode
  )

  // if one of the country codes is in the url and the cache id is not set, set the cache id and redirect
  if (urlHasCountryCode && !cacheIdCookie) {
    response.cookies.set("_medusa_cache_id", cacheId, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }

  // Language Logic: Set default locale cookie if missing
  const localeCookie = request.cookies.get("_medusa_locale")
  if (!localeCookie) {
    response.cookies.set("_medusa_locale", "default", {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    })
  }

  // if one of the country codes is in the url and the cache id is set, return next
  if (urlHasCountryCode && cacheIdCookie) {
    return response // return response here to include cookie updates
  }

  // if one of the country codes is in the url and the cache id is not set, set the cache id and redirect
  if (urlHasCountryCode && !cacheIdCookie) {
    return response
  }

  // check if the url is a static asset
  if (request.nextUrl.pathname.includes(".")) {
    return NextResponse.next()
  }

  const redirectPath =
    request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname

  const queryString = request.nextUrl.search ? request.nextUrl.search : ""

  // If no country code is set, we redirect to the relevant region.
  if (!urlHasCountryCode && countryCode) {
    redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`
    response = NextResponse.redirect(`${redirectUrl}`, 307)
  } else if (!urlHasCountryCode && !countryCode) {
    // Handle case where no valid country code exists (empty regions)
    return new NextResponse(
      "No valid regions configured. Please set up regions with countries in your Medusa Admin.",
      { status: 500 }
    )
  }

  return response
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|llms.txt|robots.txt|sitemap.xml|manifest.json|images|assets|png|svg|jpg|jpeg|gif|webp).*)",
  ],
}

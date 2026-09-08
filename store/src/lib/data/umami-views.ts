import { getUmamiServerUrl } from "@lib/util/server-urls"

let cachedViews: Record<string, number> | null = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000

function getUmamiCredentials() {
  const umamiUrl = getUmamiServerUrl()
  const username = process.env.UMAMI_USERNAME
  const password = process.env.UMAMI_PASSWORD

  if (process.env.NODE_ENV === "production" && (!username || !password)) {
    return null
  }

  return {
    umamiUrl,
    username: username || "admin",
    password: password || "umami",
  }
}

async function getUmamiToken(credentials: {
  umamiUrl: string
  username: string
  password: string
}) {
  const res = await fetch(`${credentials.umamiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Umami auth failed: ${res.statusText}`)
  }

  const data = await res.json()
  return data.token as string
}

function parseViewMap(metricsData: { x: string; y: number }[]) {
  const viewMap: Record<string, number> = {}

  metricsData.forEach((item) => {
    const path = item.x
    const views = item.y

    const productMatch = path.match(/\/products\/([^/?#]+)/)
    if (productMatch?.[1]) {
      const productHandle = productMatch[1]
      viewMap[productHandle] = (viewMap[productHandle] || 0) + views
    }

    const blogMatch = path.match(/\/blog\/([^/?#]+)/)
    if (blogMatch?.[1]) {
      const blogId = blogMatch[1]
      viewMap[blogId] = (viewMap[blogId] || 0) + views
    }
  })

  return viewMap
}

/** Fetch all product/blog view counts from Umami (cached for 1 minute). */
export async function getUmamiViewMap(): Promise<Record<string, number>> {
  const now = Date.now()
  if (cachedViews && now - cacheTime <= CACHE_TTL) {
    return cachedViews
  }

  const credentials = getUmamiCredentials()
  if (!credentials) {
    return {}
  }

  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  if (!websiteId) {
    console.warn("UMAMI_WEBSITE_ID is not configured in environment variables.")
    return {}
  }

  try {
    const token = await getUmamiToken(credentials)
    const metricsUrl = `${credentials.umamiUrl}/api/websites/${websiteId}/metrics?type=path&startAt=0&endAt=${now}`

    const metricsRes = await fetch(metricsUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!metricsRes.ok) {
      throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`)
    }

    const metricsData: { x: string; y: number }[] = await metricsRes.json()
    cachedViews = parseViewMap(metricsData)
    cacheTime = now
    return cachedViews
  } catch (error) {
    console.error("Umami views fetch error:", error)
    return cachedViews ?? {}
  }
}

/** View count for a single product handle or blog post id. */
export async function getUmamiViewCount(handle: string): Promise<number> {
  const viewMap = await getUmamiViewMap()
  return viewMap[handle] || 0
}

/** Reset in-memory cache (for tests). */
export function resetUmamiViewsCache() {
  cachedViews = null
  cacheTime = 0
}

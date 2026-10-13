"use server"
import { cacheLife, cacheTag } from "next/cache"
import { getStrapiServerUrl } from "@lib/util/server-urls"
import { fetchWithRetry } from "@lib/util/fetch-retry"

const STRAPI_URL = getStrapiServerUrl()
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

export interface NavigationItem {
  id: number
  title: string
  type: string
  path: string
  externalPath: string
  uiRouterKey: string
  menuAttached: boolean
  order: number
  collapsed: boolean
  related?: any
  items?: NavigationItem[]
}

export const getNavigation = async (
  slugOrId: string = "navigation"
): Promise<NavigationItem[]> => {
  return _cachedNavigation(slugOrId)
}

async function _cachedNavigation(
  slugOrId: string = "navigation"
): Promise<NavigationItem[]> {
  "use cache"
  cacheTag("navigation")

  try {
    const response = await fetchWithRetry(
      `${STRAPI_URL}/api/navigation/render/${slugOrId}?type=TREE`,
      {
        headers: {
          ...(STRAPI_API_TOKEN && {
            Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          }),
        },
      }
    )

    if (!response.ok) {
      if (
        response.status === 404 ||
        response.status === 401 ||
        response.status === 403
      ) {
        cacheLife("days")
        return []
      }
      throw new Error(`Strapi navigation fetch failed: ${response.status}`)
    }

    const data = await response.json()
    cacheLife("days")
    return Array.isArray(data) ? data : []
  } catch (error) {
    cacheLife("minutes")
    return []
  }
}

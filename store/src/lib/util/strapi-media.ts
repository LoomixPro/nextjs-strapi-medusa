import { getStrapiPublicUrl } from "@lib/util/server-urls"

/**
 * Normalizes a media URL from Strapi by ensuring it's an absolute URL.
 * Accepts either a string URL or a media object containing a `url` property.
 */
export const getMediaUrl = (
  mediaObjOrUrl?: string | { url?: string }
): string | null => {
  if (!mediaObjOrUrl) return null

  const url =
    typeof mediaObjOrUrl === "string" ? mediaObjOrUrl : mediaObjOrUrl.url
  if (!url) return null

  if (url.startsWith("http")) return url

  let baseUrl = getStrapiPublicUrl()
  if (!baseUrl.startsWith("http")) {
    baseUrl = `http://${baseUrl}`
  }

  baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
  const path = url.startsWith("/") ? url : `/${url}`

  return `${baseUrl}${path}`
}

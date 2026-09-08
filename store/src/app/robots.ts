import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = getBaseURL()
  const settings = await getStorefrontSettings()
  const allowIndexing = settings.allowIndexing ?? true

  if (!allowIndexing) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/checkout", "/account/*", "/cart", "/api/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

import { sdk } from "@lib/config"
import { cacheTag } from "next/cache"

export const listTags = async (query?: Record<string, any>) => {
  "use cache"

  const limit = query?.limit || 100

  const response = await sdk.client.fetch<{ product_tags: any[] }>(
    "/store/product-tags",
    {
      query: {
        limit,
        ...query,
      },
    }
  )

  cacheTag("tags")
  return response.product_tags
}

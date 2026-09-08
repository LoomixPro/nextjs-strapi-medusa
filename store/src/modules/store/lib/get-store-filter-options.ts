import { cache } from "react"

import { listCategories } from "@lib/data/categories"
import { listTags } from "@lib/data/tags"
import { listActiveCampaigns } from "@lib/data/campaigns"
import {
  getMeilisearchIndexName,
  getMeilisearchServerApiKey,
  getMeilisearchServerUrl,
} from "@lib/util/server-urls"
import { HttpTypes } from "@medusajs/types"

export type StoreColorOption = { name: string; hex: string }

export type StoreFilterOptions = {
  categories: HttpTypes.StoreProductCategory[]
  tags: { id: string; value: string }[]
  activeCampaigns: Awaited<ReturnType<typeof listActiveCampaigns>>
  availableColors: StoreColorOption[]
}

export const getStoreFilterOptions = cache(async function getStoreFilterOptions(
  categoryId?: string
): Promise<StoreFilterOptions> {
  const meilisearchHost = getMeilisearchServerUrl()
  const meilisearchApiKey = getMeilisearchServerApiKey()
  const indexName = getMeilisearchIndexName()

  const [categories, tags, activeCampaigns, facetRes] = await Promise.all([
    categoryId ? Promise.resolve([]) : listCategories(),
    listTags(),
    listActiveCampaigns(),
    fetch(`${meilisearchHost}/indexes/${indexName}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${meilisearchApiKey}`,
      },
      body: JSON.stringify({ q: "", limit: 0, facets: ["color_facets"] }),
      cache: "no-store",
    }).catch(() => null),
  ])

  const availableColorsMap = new Map<string, StoreColorOption>()
  if (facetRes?.ok) {
    const data = (await facetRes.json()) as {
      facetDistribution: Record<string, Record<string, number>>
    }
    const colorFacets = data.facetDistribution?.color_facets
    if (colorFacets) {
      for (const [facetString, count] of Object.entries(colorFacets)) {
        if (count > 0 && facetString.includes("::")) {
          const [colorName, hexCode] = facetString.split("::")
          const name = colorName.charAt(0).toUpperCase() + colorName.slice(1)
          const lowerName = name.toLowerCase()
          const isTrueHex = hexCode.startsWith("#")

          if (!availableColorsMap.has(lowerName) || isTrueHex) {
            availableColorsMap.set(lowerName, {
              name,
              hex: isTrueHex
                ? hexCode
                : (availableColorsMap.get(lowerName)?.hex ??
                  colorName.toLowerCase()),
            })
          }
        }
      }
    }
  }

  return {
    categories,
    tags,
    activeCampaigns,
    availableColors: Array.from(availableColorsMap.values()),
  }
})

"use server"
import { cacheTag } from "next/cache"
import { fetchWithRetry } from "@lib/util/fetch-retry"

export interface StoreCampaign {
  id: string
  name: string
  campaign_identifier?: string
  starts_at?: string
  ends_at?: string
  promotions?: { code: string }[]
}

export interface CampaignProductsResult {
  productIds: string[]
  categoryIds: string[]
  collectionIds: string[]
  typeIds: string[]
  tagIds: string[]
  promoCodes: string[]
}

export const listActiveCampaigns = async (): Promise<StoreCampaign[]> => {
  "use cache"
  try {
    const baseUrl =
      process.env.MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      "http://localhost:9000"

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const res = await fetchWithRetry(`${baseUrl}/store/campaigns`, {
      headers: {
        "x-publishable-api-key": publishableKey,
      },
    })
    cacheTag("store-campaigns")

    if (!res.ok) return []

    const data = await res.json()
    return data.campaigns || []
  } catch (error) {
    console.error("Failed to fetch active campaigns:", error)
    return []
  }
}

export const getCampaignProducts = async (
  campaignId: string
): Promise<CampaignProductsResult> => {
  "use cache"
  try {
    const baseUrl =
      process.env.MEDUSA_BACKEND_URL ||
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
      "http://localhost:9000"

    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

    const res = await fetchWithRetry(
      `${baseUrl}/store/campaigns/${campaignId}/products`,
      {
        headers: {
          "x-publishable-api-key": publishableKey,
        },
      }
    )
    cacheTag(`store-campaign-${campaignId}`)

    if (!res.ok)
      return {
        productIds: [],
        categoryIds: [],
        collectionIds: [],
        typeIds: [],
        tagIds: [],
        promoCodes: [],
      }

    const data = await res.json()
    return {
      productIds: data.productIds || [],
      categoryIds: data.categoryIds || [],
      collectionIds: data.collectionIds || [],
      typeIds: data.typeIds || [],
      tagIds: data.tagIds || [],
      promoCodes: data.promoCodes || [],
    }
  } catch (error) {
    console.error(`Failed to fetch products for campaign ${campaignId}:`, error)
    return {
      productIds: [],
      categoryIds: [],
      collectionIds: [],
      typeIds: [],
      tagIds: [],
      promoCodes: [],
    }
  }
}

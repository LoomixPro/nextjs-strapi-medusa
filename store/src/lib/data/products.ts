"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getLocaleHeader } from "@lib/util/get-locale-header"
import { getRegion, retrieveRegion } from "./regions"
import { getProductPrice } from "@lib/util/get-product-price"
import {
  isNetworkFetchError,
  warnMedusaUnreachable,
  withMedusaFallback,
} from "@lib/util/medusa-fetch"
import {
  getMeilisearchIndexName,
  getMeilisearchServerApiKey,
  getMeilisearchServerUrl,
} from "@lib/util/server-urls"
import { meilisearchFilterEquals } from "@lib/util/meilisearch-filter"
import { revalidateTag } from "next/cache"
import {
  ProductReviewSummary,
  StoreProductReview,
  StoreProductQuestion,
} from "../../types/global"

import { getCampaignProducts } from "./campaigns"

// Extended type to include custom filter parameters
type ExtendedStoreProductParams = HttpTypes.StoreProductParams & {
  price_min?: number
  price_max?: number
  only_available?: string
  on_sale?: string
  campaign_id?: string | string[]
  color?: string // comma-separated color names
  category_id?: string[]
  collection_id?: string[]
  tag_id?: string[]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
  disableAuth = false,
}: {
  pageParam?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  countryCode?: string
  regionId?: string
  disableAuth?: boolean
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode, disableAuth)
  } else {
    region = await retrieveRegion(regionId!, disableAuth)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(disableAuth ? {} : await getAuthHeaders()),
    ...(await getLocaleHeader(disableAuth)),
  } as Record<string, string>

  const next = {
    ...(disableAuth
      ? { tags: ["store-products"] }
      : await getCacheOptions("store-products")),
    revalidate: 3600,
  }

  try {
    return await sdk.client
      .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
        `/store/products`,
        {
          method: "GET",
          query: {
            limit,
            offset,
            region_id: region?.id,
            fields:
              "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*options,*options.values,*variants.options,+metadata,+tags",
            ...queryParams,
          },
          headers,
          next,
          cache: "force-cache",
        }
      )
      .then(({ products, count }) => {
        const nextPage = count > offset + limit ? pageParam + 1 : null
        return {
          response: {
            products,
            count,
          },
          nextPage: nextPage,
          queryParams,
        }
      })
  } catch (error) {
    if (isNetworkFetchError(error)) {
      warnMedusaUnreachable("listProducts")
      return {
        response: { products: [], count: 0 },
        nextPage: null,
        queryParams,
      }
    }

    throw error
  }
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
}: {
  page?: number
  queryParams?: HttpTypes.FindParams & ExtendedStoreProductParams
  sortBy?: SortOptions
  countryCode: string
}): Promise<{
  response: {
    products: HttpTypes.StoreProduct[]
    count: number
    facets?: Record<string, Record<string, number>>
  }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & ExtendedStoreProductParams
}> => {
  const limit = queryParams?.limit || 12
  const offset = (page === 0 ? 0 : page - 1) * limit

  // Extract custom filter params
  const priceMin = queryParams?.price_min
  const priceMax = queryParams?.price_max
  const onlyAvailable = queryParams?.only_available
  const onSale = queryParams?.on_sale
  const campaignParam = queryParams?.campaign_id
  const colorFilter = queryParams?.color
  const categoryIds = queryParams?.category_id as string[] | undefined
  const tagIds = queryParams?.tag_id as string[] | undefined

  // Build Meilisearch Filter Array
  const filter: string[] = []

  // Campaign filter processing
  let campaignTargets: {
    productIds: string[]
    categoryIds: string[]
    collectionIds: string[]
    tagIds: string[]
    hasAnyRule: boolean
  } | null = null

  if (campaignParam) {
    const campaignIds = Array.isArray(campaignParam)
      ? campaignParam
      : [campaignParam]
    const campaignProdIds: string[] = []
    const campaignCatIds: string[] = []
    const campaignColIds: string[] = []
    const campaignTagIds: string[] = []
    let hasRules = false

    for (const cId of campaignIds) {
      if (cId) {
        const target = await getCampaignProducts(cId)
        if (target.productIds.length > 0)
          campaignProdIds.push(...target.productIds)
        if (target.categoryIds.length > 0)
          campaignCatIds.push(...target.categoryIds)
        if (target.collectionIds.length > 0)
          campaignColIds.push(...target.collectionIds)
        if (target.tagIds?.length > 0) campaignTagIds.push(...target.tagIds)
        if (
          target.productIds.length > 0 ||
          target.categoryIds.length > 0 ||
          target.collectionIds.length > 0 ||
          (target.tagIds && target.tagIds.length > 0)
        ) {
          hasRules = true
        }
      }
    }

    campaignTargets = {
      productIds: campaignProdIds,
      categoryIds: campaignCatIds,
      collectionIds: campaignColIds,
      tagIds: campaignTagIds,
      hasAnyRule: hasRules,
    }

    const campaignMeiliFilters: string[] = []
    if (campaignCatIds.length > 0) {
      campaignMeiliFilters.push(
        `(${campaignCatIds
          .map((id) => meilisearchFilterEquals("categories.id", id))
          .join(" OR ")})`
      )
    }
    if (campaignColIds.length > 0) {
      campaignMeiliFilters.push(
        `(${campaignColIds
          .map((id) => meilisearchFilterEquals("collection_id", id))
          .join(" OR ")})`
      )
    }
    if (campaignTagIds.length > 0) {
      campaignMeiliFilters.push(
        `(${campaignTagIds
          .map((id) => meilisearchFilterEquals("tags.id", id))
          .join(" OR ")})`
      )
    }

    if (campaignMeiliFilters.length > 0) {
      filter.push(`(${campaignMeiliFilters.join(" OR ")})`)
    }
  }

  // Availability filter
  if (onlyAvailable === "true") {
    filter.push(`variants.inventory_quantity >= 1`)
  }

  // Color filter
  // We filter against 'options.value' since it holds the exact name ('Green'),
  // while 'color_facets' holds the compound 'Green::#008800' which makes exact matching hard.
  if (colorFilter) {
    const selectedColors = colorFilter
      .split(",")
      .map((c) => meilisearchFilterEquals("options.value", c))
    if (selectedColors.length > 0) {
      filter.push(`(${selectedColors.join(" OR ")})`)
    }
  }

  // Category filter
  if (categoryIds && categoryIds.length > 0) {
    const categoryFilters = categoryIds.map((id) =>
      meilisearchFilterEquals("categories.id", id)
    )
    filter.push(`(${categoryFilters.join(" OR ")})`)
  }

  // Tag filter
  if (tagIds && tagIds.length > 0) {
    const tagFilters = tagIds.map((id) =>
      meilisearchFilterEquals("tags.id", id)
    )
    filter.push(`(${tagFilters.join(" OR ")})`)
  }

  // Collection filter
  if (queryParams?.collection_id && Array.isArray(queryParams.collection_id)) {
    const collectionFilters = queryParams.collection_id.map((id) =>
      meilisearchFilterEquals("collection_id", id)
    )
    filter.push(`(${collectionFilters.join(" OR ")})`)
  }

  // Determine Meilisearch Sort Array
  let sort = ["created_at:desc"]
  if (sortBy === "price_asc") {
    sort = ["variants.calculated_price.calculated_amount:asc"]
  } else if (sortBy === "price_desc") {
    sort = ["variants.calculated_price.calculated_amount:desc"]
  }

  const meilisearchHost = getMeilisearchServerUrl()
  const meilisearchApiKey = getMeilisearchServerApiKey()
  const indexName = getMeilisearchIndexName()

  if (!meilisearchHost || !meilisearchApiKey) {
    console.error("Meilisearch environment variables missing")
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  try {
    const next = {
      ...(await getCacheOptions("store-products")),
    }

    // 1. Campaign with explicit product IDs: fetch by ID and post-filter.
    // Category/collection/tag-only campaigns fall through to Meilisearch below.
    if (campaignTargets) {
      if (!campaignTargets.hasAnyRule) {
        return {
          response: { products: [], count: 0 },
          nextPage: null,
        }
      }

      if (campaignTargets.productIds.length > 0) {
        const { response: listResponse } = await listProducts({
          countryCode,
          queryParams: {
            id: campaignTargets.productIds,
            limit: campaignTargets.productIds.length,
          },
        })

        let products = listResponse.products || []

        // Apply secondary post-filters (onSale, price range, availability, colors)
        products = products.filter((p) => {
          if (onlyAvailable === "true") {
            const hasInventory = p.variants?.some(
              (v: any) => (v.inventory_quantity ?? 0) >= 1
            )
            if (!hasInventory) return false
          }

          const priceObj = getProductPrice({ product: p })
          const amount = priceObj.cheapestPrice?.calculated_price_number
          if (amount != null) {
            if (priceMin !== undefined && amount < priceMin) return false
            if (priceMax !== undefined && amount > priceMax) return false
          }

          if (onSale === "true") {
            const diff = Number(priceObj.cheapestPrice?.percentage_diff ?? 0)
            const isSaleType = priceObj.cheapestPrice?.price_type === "sale"
            const original = priceObj.cheapestPrice?.original_price_number
            const calculated = priceObj.cheapestPrice?.calculated_price_number

            const isOnSale =
              diff > 0 ||
              isSaleType ||
              (original != null && calculated != null && original > calculated)

            if (!isOnSale) return false
          }

          return true
        })

        const totalCount = products.length
        const paginatedProducts = products.slice(offset, offset + limit)

        return {
          response: { products: paginatedProducts, count: totalCount },
          nextPage:
            totalCount > offset + limit ? (page === 0 ? 2 : page + 1) : null,
        }
      }
    }

    const hasPostFilter =
      priceMin !== undefined || priceMax !== undefined || onSale === "true"
    const searchLimit = hasPostFilter ? 100 : limit
    const searchOffset = hasPostFilter ? 0 : offset

    const response = await fetch(
      `${meilisearchHost}/indexes/${indexName}/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${meilisearchApiKey}`,
        },
        body: JSON.stringify({
          q: "",
          limit: searchLimit,
          offset: searchOffset,
          filter: filter.length > 0 ? filter : undefined,
          sort,
          facets: ["color_facets"],
        }),
        cache: "force-cache",
        next,
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error("Meilisearch API error", errText)
      throw new Error(`Meilisearch API error: ${response.statusText}`)
    }

    const data = await response.json()

    const productIds = (data.hits as HttpTypes.StoreProduct[])
      .map((p) => p.id)
      .filter(Boolean) as string[]

    let products: HttpTypes.StoreProduct[] = []
    if (productIds.length > 0) {
      const { response: listResponse } = await listProducts({
        countryCode,
        queryParams: {
          id: productIds,
          limit: productIds.length,
        },
      })
      products = productIds
        .map((id) => listResponse.products.find((p) => p.id === id))
        .filter(Boolean) as HttpTypes.StoreProduct[]
    }

    if (hasPostFilter) {
      products = products.filter((p) => {
        const priceObj = getProductPrice({ product: p })
        const amount = priceObj.cheapestPrice?.calculated_price_number
        if (amount == null) return false

        if (priceMin !== undefined && amount < priceMin) return false
        if (priceMax !== undefined && amount > priceMax) return false

        if (onSale === "true") {
          const diff = Number(priceObj.cheapestPrice?.percentage_diff ?? 0)
          const isSaleType = priceObj.cheapestPrice?.price_type === "sale"
          const original = priceObj.cheapestPrice?.original_price_number
          const calculated = priceObj.cheapestPrice?.calculated_price_number

          const isOnSale =
            diff > 0 ||
            isSaleType ||
            (original != null && calculated != null && original > calculated)

          if (!isOnSale) return false
        }

        return true
      })
    }

    const totalCount = hasPostFilter
      ? products.length
      : data.estimatedTotalHits || data.totalHits || 0

    // Paginate manually if post filter was applied
    if (hasPostFilter) {
      products = products.slice(offset, offset + limit)
    }

    const nextPage =
      totalCount > offset + limit ? (page === 0 ? 2 : page + 1) : null

    return {
      response: {
        products,
        count: totalCount,
        facets: data.facetDistribution,
      },
      nextPage,
      queryParams,
    }
  } catch (error) {
    console.error("Error querying Meilisearch:", error)
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }
}

export async function getProductReviewSummaries(
  productIds: string[]
): Promise<Record<string, ProductReviewSummary>> {
  if (productIds.length === 0) {
    return {}
  }

  const headers = {
    ...(await getAuthHeaders()),
    ...(await getLocaleHeader()),
  }

  const next = {
    ...(await getCacheOptions("product-review-summaries")),
  }

  return withMedusaFallback(
    async () => {
      const data = await sdk.client.fetch<{
        summaries: Record<string, ProductReviewSummary>
      }>("/store/reviews/summaries", {
        headers,
        query: {
          product_ids: productIds.join(","),
        },
        next,
        cache: "no-store",
      })

      return data.summaries || {}
    },
    {},
    "getProductReviewSummaries"
  )
}

export const getProductReviews = async ({
  productId,
  limit = 10,
  offset = 0,
  is_verified_buyer,
  order = "-created_at",
}: {
  productId: string
  limit?: number
  offset?: number
  is_verified_buyer?: boolean
  order?: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getLocaleHeader()),
  }

  const next = {
    ...(await getCacheOptions(`product-reviews-${productId}`)),
  }

  const query: Record<string, any> = {
    limit,
    offset,
    order,
  }

  if (is_verified_buyer !== undefined) {
    query.is_verified_buyer = is_verified_buyer
  }

  const emptyResponse = {
    reviews: [] as StoreProductReview[],
    average_rating: 0,
    limit,
    offset,
    count: 0,
  }

  return withMedusaFallback(
    () =>
      sdk.client.fetch<{
        reviews: StoreProductReview[]
        average_rating: number
        limit: number
        offset: number
        count: number
      }>(`/store/products/${productId}/reviews`, {
        headers,
        query,
        next,
        cache: "no-store",
      }),
    emptyResponse,
    "getProductReviews"
  )
}

export const addProductReview = async (input: {
  title?: string
  content: string
  first_name: string
  last_name: string
  rating: number
  product_id: string
}) => {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getLocaleHeader()),
  }

  return sdk.client
    .fetch(`/store/reviews`, {
      method: "POST",
      headers,
      body: input,
      cache: "no-store",
    })
    .then((result) => {
      revalidateTag(`product-reviews-${input.product_id}`, "max")
      return result
    })
}

export const toggleReviewReaction = async (
  reviewId: string,
  productId: string,
  type: "like" | "dislike"
) => {
  const headers = {
    ...(await getAuthHeaders()),
    ...(await getLocaleHeader()),
  }

  return sdk.client
    .fetch<{
      like_count: number
      dislike_count: number
      user_reaction: "like" | "dislike" | null
    }>(`/store/reviews/${reviewId}/reactions`, {
      method: "POST",
      headers,
      body: { type },
      cache: "no-store",
    })
    .then((res) => {
      revalidateTag(`product-reviews-${productId}`, "max")
      return res
    })
}

export const getProductQuestions = async ({
  productId,
  limit = 10,
  offset = 0,
}: {
  productId: string
  limit?: number
  offset?: number
}) => {
  const next = {
    ...(await getCacheOptions(`product-questions-${productId}`)),
    revalidate: 3600,
  }

  const emptyResponse = {
    questions: [] as StoreProductQuestion[],
    limit,
    offset,
    count: 0,
  }

  return withMedusaFallback(
    () =>
      sdk.client.fetch<{
        questions: StoreProductQuestion[]
        limit: number
        offset: number
        count: number
      }>(`/store/products/${productId}/questions`, {
        query: {
          limit,
          offset,
          order: "-created_at",
        },
        next,
        cache: "no-store",
      }),
    emptyResponse,
    "getProductQuestions"
  )
}

export const submitQuestion = async (input: {
  name: string
  email: string
  question_text: string
  product_id: string
}) => {
  return sdk.client
    .fetch(`/store/questions`, {
      method: "POST",
      body: input,
      cache: "no-store",
    })
    .then((result) => {
      revalidateTag(`product-questions-${input.product_id}`, "max")
      return result
    })
}

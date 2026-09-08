"use server"

import { sdk } from "@lib/config"
import { getLocaleHeader } from "@lib/util/get-locale-header"
import { withMedusaFallback } from "@lib/util/medusa-fetch"
import { HttpTypes } from "@medusajs/types"
import { getCacheOptions } from "./cookies"

type CollectionFetchOptions = {
  isStatic?: boolean
}

export const retrieveCollection = async (
  id: string,
  { isStatic = false }: CollectionFetchOptions = {}
) => {
  const next = {
    ...(isStatic
      ? { tags: ["collections"], revalidate: 3600 }
      : await getCacheOptions("collections")),
  }
  const headers = await getLocaleHeader(isStatic)

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<{ collection: HttpTypes.StoreCollection }>(
          `/store/collections/${id}`,
          {
            next,
            cache: "force-cache",
            headers,
          }
        )
        .then(({ collection }) => collection),
    undefined,
    `retrieveCollection(${id})`
  )
}

export const listCollections = async (
  queryParams: Record<string, string> = {},
  { isStatic = false }: CollectionFetchOptions = {}
): Promise<{ collections: HttpTypes.StoreCollection[]; count: number }> => {
  const next = {
    ...(isStatic
      ? { tags: ["collections"], revalidate: 3600 }
      : await getCacheOptions("collections")),
  }

  const headers = await getLocaleHeader(isStatic)
  queryParams.limit = queryParams.limit || "100"
  queryParams.offset = queryParams.offset || "0"

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<{ collections: HttpTypes.StoreCollection[]; count: number }>(
          "/store/collections",
          {
            query: queryParams,
            next,
            cache: "force-cache",
            headers,
          }
        )
        .then(({ collections }) => ({
          collections: collections || [],
          count: collections?.length || 0,
        })),
    { collections: [], count: 0 },
    "listCollections"
  )
}

export const getCollectionByHandle = async (
  handle: string,
  { isStatic = false }: CollectionFetchOptions = {}
): Promise<HttpTypes.StoreCollection> => {
  const next = {
    ...(isStatic
      ? { tags: ["collections"], revalidate: 3600 }
      : await getCacheOptions("collections")),
  }
  const headers = await getLocaleHeader(isStatic)

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<HttpTypes.StoreCollectionListResponse>(`/store/collections`, {
          query: { handle, fields: "*products" },
          next,
          cache: "force-cache",
          headers,
        })
        .then(
          ({ collections }) => collections?.[0] as HttpTypes.StoreCollection
        ),
    undefined as any,
    `getCollectionByHandle(${handle})`
  )
}

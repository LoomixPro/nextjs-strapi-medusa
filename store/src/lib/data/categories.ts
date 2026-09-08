import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getLocaleHeader } from "@lib/util/get-locale-header"
import { withMedusaFallback } from "@lib/util/medusa-fetch"
import { getCacheOptions } from "./cookies"

type CategoryFetchOptions = {
  isStatic?: boolean
}

export const listCategories = async (
  query?: Record<string, any>,
  { isStatic = false }: CategoryFetchOptions = {}
) => {
  const next = isStatic
    ? { tags: ["categories"], revalidate: 3600 }
    : { ...(await getCacheOptions("categories")), revalidate: 3600 }

  const limit = query?.limit || 100
  const headers = await getLocaleHeader(isStatic)

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<{ product_categories: HttpTypes.StoreProductCategory[] }>(
          "/store/product-categories",
          {
            query: {
              fields:
                "*category_children, *products, *parent_category, *parent_category.parent_category",
              limit,
              ...query,
            },
            next,
            cache: "force-cache",
            headers,
          }
        )
        .then(({ product_categories }) => product_categories || []),
    [],
    "listCategories"
  )
}

export const getCategoryByHandle = async (
  categoryHandle: string[],
  { isStatic = false }: CategoryFetchOptions = {}
) => {
  const handle = `${categoryHandle.join("/")}`

  const next = isStatic
    ? { tags: ["category-products"], revalidate: 3600 }
    : { ...(await getCacheOptions("category-products")), revalidate: 3600 }

  const headers = await getLocaleHeader(isStatic)

  return withMedusaFallback(
    () =>
      sdk.client
        .fetch<HttpTypes.StoreProductCategoryListResponse>(
          `/store/product-categories`,
          {
            query: {
              fields: "*category_children, *products",
              handle,
            },
            next,
            cache: "force-cache",
            headers,
          }
        )
        .then(
          ({ product_categories }) =>
            product_categories?.[0] as HttpTypes.StoreProductCategory
        ),
    undefined as any,
    `getCategoryByHandle(${handle})`
  )
}

import { Suspense } from "react"
import {
  getProductReviewSummaries,
  listProductsWithSort,
} from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import ProductCard from "@modules/products/components/product-cards"
import { Pagination } from "@modules/store/components/pagination"
import SyncProductCount from "@modules/store/components/sync-product-count"
import { SortOptions } from "@modules/store/components/sort-bar"
import { getTranslations } from "next-intl/server"

import { listActiveCampaigns } from "@lib/data/campaigns"
import { Tag } from "lucide-react"

const PRODUCT_LIMIT = 12

interface PaginatedProductsParams {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  tag_id?: string[]
  id?: string[]
  order?: string
  price_min?: number
  price_max?: number
  only_available?: string // "true" or "false"
  on_sale?: string
  campaign_id?: string | string[]
  category?: string[] // category handles
  color?: string // comma-separated color names
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  searchParams,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  searchParams?: {
    price_min?: string
    price_max?: string
    only_available?: string
    on_sale?: string
    campaign_id?: string | string[]
    color?: string
    category_id?: string | string[]
    tag_id?: string | string[]
    cols?: string
  }
}) {
  const t = await getTranslations("Store")
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams.collection_id = [collectionId]
  }

  if (categoryId) {
    queryParams.category_id = [categoryId]
  }

  if (productsIds) {
    queryParams.id = productsIds
  }

  // Pass through search params for filtering
  if (searchParams) {
    if (searchParams.price_min)
      queryParams.price_min = Number(searchParams.price_min)
    if (searchParams.price_max)
      queryParams.price_max = Number(searchParams.price_max)
    if (searchParams.only_available)
      queryParams.only_available = searchParams.only_available
    if (searchParams.on_sale) queryParams.on_sale = searchParams.on_sale
    if (searchParams.campaign_id)
      queryParams.campaign_id = searchParams.campaign_id
    if (searchParams.color) queryParams.color = searchParams.color

    // Handle category filtering from sidebar
    if (searchParams.category_id) {
      const categoryIds = Array.isArray(searchParams.category_id)
        ? searchParams.category_id
        : [searchParams.category_id]

      // Merge with existing categoryId if present
      if (queryParams.category_id) {
        queryParams.category_id = [...queryParams.category_id, ...categoryIds]
      } else {
        queryParams.category_id = categoryIds
      }
    }

    // Handle tag filtering from sidebar
    if (searchParams.tag_id) {
      const tagIds = Array.isArray(searchParams.tag_id)
        ? searchParams.tag_id
        : [searchParams.tag_id]

      if (queryParams.tag_id) {
        queryParams.tag_id = [...queryParams.tag_id, ...tagIds]
      } else {
        queryParams.tag_id = tagIds
      }
    }
  }

  if (sortBy === "created_at") {
    queryParams.order = "created_at"
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Fetch Strapi settings to determine which card to use
  const settings = await getStorefrontSettings()

  // Determine card type based on page context
  let cardType = settings.productCard.storeCardType // Default to store

  if (categoryId) {
    cardType = settings.productCard.categoryCardType
  } else if (collectionId) {
    cardType = settings.productCard.collectionCardType
  }

  // Resolve campaign banner details if campaign_id filter is active
  let activeCampaignBanner: { name: string; codes: string[] } | null = null
  if (searchParams?.campaign_id) {
    const activeCampaigns = await listActiveCampaigns()
    const selectedCampId = Array.isArray(searchParams.campaign_id)
      ? searchParams.campaign_id[0]
      : searchParams.campaign_id
    const matched = activeCampaigns.find((c) => c.id === selectedCampId)
    if (matched) {
      const codes = matched.promotions?.map((p) => p.code).filter(Boolean) ?? []
      activeCampaignBanner = { name: matched.name, codes }
    }
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const reviewSummaries = await getProductReviewSummaries(
    products.map((product) => product.id)
  )

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <div className="w-full">
      <SyncProductCount count={count} />
      {/* Campaign Banner with Promo Code */}
      {activeCampaignBanner && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-950 dark:text-emerald-100">
          <div className="flex items-center gap-3 rtl:text-right">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-foreground">
                {t("filter_sidebar.active_campaign_title", {
                  name: activeCampaignBanner.name,
                })}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("filter_sidebar.active_campaign_desc")}
              </p>
            </div>
          </div>
          {activeCampaignBanner.codes.length > 0 && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("filter_sidebar.promo_code")}
              </span>
              <div className="flex gap-1.5">
                {activeCampaignBanner.codes.map((code) => (
                  <code
                    key={code}
                    className="px-3 py-1.5 bg-background dark:bg-zinc-900 border border-emerald-500/40 rounded-xl font-mono text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wider shadow-xs select-all"
                  >
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {products.length > 0 ? (
        <ul
          className={
            searchParams?.cols === "1"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
              : "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6"
          }
          data-testid="products-list"
        >
          {products.map((p) => {
            return (
              <li key={p.id}>
                <ProductCard
                  product={p}
                  region={region}
                  cardType={cardType}
                  reviewSummary={reviewSummaries[p.id] ?? null}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="bg-muted/10 rounded-3xl p-20 text-center border border-dashed border-border">
          <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-muted-foreground/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {t("no_products_found")}
          </h3>
          <p className="text-muted-foreground">
            {t("no_products_description")}
          </p>
        </div>
      )}

      {totalPages > 1 && (
        <Suspense fallback={null}>
          <Pagination
            data-testid="product-pagination"
            page={page}
            totalPages={totalPages}
          />
        </Suspense>
      )}
    </div>
  )
}

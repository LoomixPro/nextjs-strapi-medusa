import { Fragment } from "react"
import { listProducts } from "@lib/data/products"
import { getUmamiViewMap } from "@lib/data/umami-views"
import { getProductPrice } from "@lib/util/get-product-price"
import ProductShowcase from "@modules/home/components/ProductShowcase"
import { ProductShowcaseBlock as BlockType } from "@lib/data/homepage"
import { HttpTypes } from "@medusajs/types"

interface ProductShowcaseBlockProps {
  block: BlockType
  region: HttpTypes.StoreRegion
  countryCode: string
  index: number
}

export default async function ProductShowcaseBlock({
  block,
  region,
  countryCode,
  index,
}: ProductShowcaseBlockProps) {
  if (!block.showcase) return null

  const showcaseData = block.showcase
  const sourceType = showcaseData.source // 'all' | 'collection' | 'category' | 'campaign' | 'custom'
  if (!sourceType) return null

  // Get the relevant component data based on the selected source type
  const sourceData = showcaseData[sourceType] as any
  const limit = showcaseData.productCount || 10
  let fetchedProducts: any[] = []
  let queryParams: any = { limit }
  let promoCode: string | undefined
  let campaignId: string | undefined

  // Modify query based on the selected Strapi component source
  switch (sourceType) {
    case "collection":
      if (sourceData?.collection?.medusaId) {
        queryParams.collection_id = [sourceData.collection.medusaId]
      }
      break
    case "category":
      if (sourceData?.category?.medusaId) {
        queryParams.category_id = [sourceData.category.medusaId]
      }
      break
    case "custom":
      if (sourceData?.products && sourceData.products.length > 0) {
        queryParams.id = sourceData.products.map((p: any) => p.medusaId)
        queryParams.limit = sourceData.products.length
      }
      break
    case "campaign":
      const campaignObj =
        sourceData?.campaign?.data?.attributes || sourceData?.campaign
      const medusaId =
        campaignObj?.medusaId ||
        sourceData?.campaign?.medusaId ||
        (sourceData?.campaign as any)?.campaign?.medusaId

      if (medusaId) {
        campaignId = medusaId
        const baseUrl =
          process.env.MEDUSA_BACKEND_URL ||
          process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
          "http://localhost:9000"
        const res = await fetch(
          `${baseUrl}/store/campaigns/${medusaId}/products`,
          {
            headers: {
              "x-publishable-api-key":
                process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
            },
            next: { revalidate: 3600 },
          }
        ).catch(() => null)

        if (res?.ok) {
          const data = await res.json()
          if (data.productIds && data.productIds.length > 0) {
            queryParams.id = data.productIds
            queryParams.limit = Math.max(limit, data.productIds.length)
          } else if (data.collectionIds && data.collectionIds.length > 0) {
            queryParams.collection_id = data.collectionIds
          } else if (data.categoryIds && data.categoryIds.length > 0) {
            queryParams.category_id = data.categoryIds
          } else if (data.tagIds && data.tagIds.length > 0) {
            queryParams.tag_id = data.tagIds
          } else if (data.typeIds && data.typeIds.length > 0) {
            queryParams.type_id = data.typeIds
          }
          if (data.promoCodes && data.promoCodes.length > 0) {
            promoCode = data.promoCodes[0]
          }
        }
      }
      break
    case "all":
    default:
      // For all and campaign, we fetch globally for now.
      break
  }

  if (
    (sourceData?.filterBy === "discounted" ||
      sourceData?.filterBy === "most_visited") &&
    sourceType !== "custom" &&
    sourceType !== "campaign"
  ) {
    queryParams.limit = 50 // Fetch more candidates to filter/sort client-side
  }

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams,
  })

  fetchedProducts = products

  // Preserve exact ordering for custom product selections
  if (sourceType === "custom" && sourceData?.products) {
    fetchedProducts = sourceData.products
      .map((p: any) => products.find((fp) => fp.id === p.medusaId))
      .filter(Boolean)
  }

  if (
    sourceData?.filterBy === "discounted" &&
    sourceType !== "custom" &&
    sourceType !== "campaign"
  ) {
    fetchedProducts = fetchedProducts
      .filter((product) => {
        try {
          const { cheapestPrice } = getProductPrice({ product })
          if (!cheapestPrice) return false

          // Product is discounted if it's explicitly on sale or has a percentage difference
          return (
            cheapestPrice.price_type === "sale" ||
            (cheapestPrice.percentage_diff &&
              parseFloat(cheapestPrice.percentage_diff) > 0)
          )
        } catch {
          return false
        }
      })
      .slice(0, limit)
  } else if (
    sourceData?.filterBy === "most_visited" &&
    sourceType !== "custom" &&
    sourceType !== "campaign"
  ) {
    try {
      const viewMap = await getUmamiViewMap()

      fetchedProducts = fetchedProducts
        .sort((a, b) => {
          const viewsA = viewMap[a.handle] || 0
          const viewsB = viewMap[b.handle] || 0
          return viewsB - viewsA
        })
        .slice(0, limit)
    } catch (e) {
      console.error("Failed to fetch umami views for sorting", e)
      fetchedProducts = fetchedProducts.slice(0, limit)
    }
  } else if (sourceType !== "custom" && sourceType !== "campaign") {
    fetchedProducts = fetchedProducts.slice(0, limit)
  }

  if (fetchedProducts.length > 0) {
    // Determine visual badge type based on source/filter
    let type: "trending" | "discount" | "campaign" = "trending"
    if (sourceType === "campaign") type = "campaign"
    else if (sourceData?.filterBy === "discounted") type = "discount"

    return (
      <Fragment key={block.id || index}>
        <ProductShowcase
          title={showcaseData.title}
          badge={showcaseData.badge || undefined}
          description={showcaseData.description || undefined}
          type={type}
          products={fetchedProducts}
          region={region}
          style={showcaseData.style || "style-1"}
          headerStyle={showcaseData.headerStyle}
          cardStyle={showcaseData.cardStyle || "card-1"}
          endsAt={
            sourceType === "campaign"
              ? sourceData?.campaign?.endsAt ||
                (sourceData?.campaign as any)?.data?.attributes?.endsAt ||
                (sourceData?.campaign as any)?.campaign?.endsAt
              : undefined
          }
          promoCode={promoCode}
          campaignId={campaignId}
        />
      </Fragment>
    )
  }

  return null
}

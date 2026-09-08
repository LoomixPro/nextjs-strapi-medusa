import { listProducts, getProductReviewSummaries } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import { getTranslations } from "next-intl/server"
import ProductCard from "@modules/products/components/product-cards"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

interface RelatedProductsProps {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)
  const t = await getTranslations("Product.related")

  if (!region) {
    return null
  }

  const settings = await getStorefrontSettings()
  const cardType = settings.productCard.storeCardType

  // Helper function to fetch and filter related products
  const fetchRelated = async (query: HttpTypes.StoreProductListParams) => {
    if (region.id) query.region_id = region.id
    query.is_giftcard = false
    query.limit = 5 // Fetch 5 to ensure we have 4 after filtering the current product

    return await listProducts({
      queryParams: query,
      countryCode,
    })
      .then(({ response }) => {
        if (response.products.length === 0) return []
        return response.products.filter(
          (responseProduct) => responseProduct.id !== product.id
        )
      })
      .catch(() => [])
  }

  let products: HttpTypes.StoreProduct[] = []

  // Priority 1: Type
  if (product.type_id) {
    products = await fetchRelated({ type_id: [product.type_id] })
  }

  // Priority 2: Category
  if (products.length === 0 && product.categories?.length) {
    const categoryIds = product.categories
      .map((c: { id: string }) => c.id)
      .filter(Boolean)
    if (categoryIds.length > 0) {
      products = await fetchRelated({ category_id: categoryIds })
    }
  }

  // Priority 3: Collection
  if (products.length === 0 && product.collection_id) {
    products = await fetchRelated({ collection_id: [product.collection_id] })
  }

  // Priority 4: Tags
  if (products.length === 0 && product.tags?.length) {
    const tagIds = product.tags.map((t) => t.id).filter(Boolean)
    if (tagIds.length > 0) {
      products = await fetchRelated({ tag_id: tagIds })
    }
  }

  if (!products.length) {
    return null
  }

  // Ensure we only show exactly 4 products maximum
  const displayProducts = products.slice(0, 4)
  const reviewSummaries = await getProductReviewSummaries(
    displayProducts.map((p) => p.id)
  )

  return (
    <div className="product-page-constraint">
      <div className="flex flex-col items-center text-center mb-16">
        <span className="text-base-regular text-gray-600 mb-6">
          {t("title")}
        </span>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          {t("description")}
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {displayProducts.map((p) => (
          <li key={p.id}>
            <ProductCard
              region={region}
              product={p}
              cardType={cardType}
              reviewSummary={reviewSummaries[p.id] ?? null}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

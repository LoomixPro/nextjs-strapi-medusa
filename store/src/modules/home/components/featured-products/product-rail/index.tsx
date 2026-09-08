import { listProducts, getProductReviewSummaries } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"

import InteractiveLink from "@modules/common/components/interactive-link"
import ProductCard from "@modules/products/components/product-cards"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price",
    },
  })

  if (!pricedProducts) {
    return null
  }

  const reviewSummaries = await getProductReviewSummaries(
    pricedProducts.map((product) => product.id)
  )

  return (
    <div className="content-container">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ui-fg-base">
          {collection.title}
        </h2>
        <InteractiveLink href={`/collections/${collection.handle}`}>
          View all
        </InteractiveLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {pricedProducts &&
          pricedProducts.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                region={region}
                cardType="card-1"
                reviewSummary={reviewSummaries[product.id] ?? null}
              />
            </li>
          ))}
      </ul>
    </div>
  )
}

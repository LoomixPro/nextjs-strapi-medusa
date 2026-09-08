import { listProducts } from "@lib/data/products"
import ProductScrollStage from "@modules/home/components/ProductScroll"
import { HttpTypes } from "@medusajs/types"
import { ProductScrollBlock as BlockType } from "@lib/data/homepage"

interface ProductScrollBlockProps {
  block: BlockType
  region: HttpTypes.StoreRegion
  countryCode: string
  index: number
}

export default async function ProductScrollBlock({
  block,
  region,
  countryCode,
  index,
}: ProductScrollBlockProps) {
  const section = block.section
  if (!section) return null

  const productIds = section.products?.map((p) => p.medusaId) || []
  if (productIds.length === 0) return null

  const {
    response: { products },
  } = await listProducts({
    countryCode,
    queryParams: {
      id: productIds,
      limit: productIds.length,
    },
  })

  // Preserve Strapi order
  const orderedProducts = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)

  if (orderedProducts.length === 0) return null

  return (
    <ProductScrollStage
      key={`${block.id || index}-products`}
      products={orderedProducts as any[]}
      region={region}
      title={section.title}
      badge={section.badge}
      description={section.description}
      buttonText={section.buttonText}
      buttonLink={section.buttonLink}
      style={section.style}
      headerStyle={section.headerStyle}
      cardStyle={section.cardStyle}
      image={section.image}
    />
  )
}

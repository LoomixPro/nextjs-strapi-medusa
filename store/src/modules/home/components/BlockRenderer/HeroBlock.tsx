import HeroStage from "@modules/home/components/Hero"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { HeroBlock as BlockType } from "@lib/data/homepage"

interface HeroBlockRendererProps {
  block: BlockType
  index: number
  region?: HttpTypes.StoreRegion
  countryCode?: string
}

export default async function HeroBlockRenderer({
  block,
  index,
  region,
  countryCode = "us",
}: HeroBlockRendererProps) {
  if (!block.section) return null

  const productIds =
    block.section.products?.map((p) => p.medusaId).filter(Boolean) || []
  let heroProducts: HttpTypes.StoreProduct[] = []

  if (productIds.length > 0) {
    try {
      const {
        response: { products },
      } = await listProducts({
        countryCode,
        queryParams: {
          id: productIds,
          limit: productIds.length,
        },
      })

      // Preserve the specific order selected in Strapi
      heroProducts = productIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as HttpTypes.StoreProduct[]
    } catch (e) {
      console.warn("[HERO] Failed to fetch selected products:", e)
    }
  }

  return (
    <HeroStage
      key={`${block.id || index}-hero`}
      section={block.section}
      heroProducts={heroProducts}
      region={region}
    />
  )
}

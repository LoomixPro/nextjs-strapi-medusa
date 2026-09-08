import { listCollections } from "@lib/data/collections"
import FeaturedProducts from "@modules/home/components/featured-products"
import { HttpTypes } from "@medusajs/types"

export default async function FallbackHome({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const { collections } = await listCollections({
    fields: "id, handle, title",
  })

  if (!collections) {
    return null
  }

  return (
    <>
      <div className="py-12">
        <ul className="flex flex-col gap-x-6">
          <FeaturedProducts collections={collections} region={region} />
        </ul>
      </div>
    </>
  )
}

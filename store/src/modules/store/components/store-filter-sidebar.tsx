import { getRegion } from "@lib/data/regions"
import { FilterSidebar } from "../components/filter-sidebar"
import { getStoreFilterOptions } from "../lib/get-store-filter-options"

export default async function StoreFilterSidebar({
  categoryId,
  countryCode,
}: {
  categoryId?: string
  countryCode?: string
}) {
  const { categories, tags, activeCampaigns, availableColors } =
    await getStoreFilterOptions(categoryId)

  const region = countryCode ? await getRegion(countryCode) : null
  const currencySymbol = region?.currency_code?.toUpperCase()

  return (
    <FilterSidebar
      categories={categories}
      tags={tags}
      availableColors={availableColors}
      activeCampaigns={activeCampaigns}
      currencySymbol={currencySymbol}
    />
  )
}

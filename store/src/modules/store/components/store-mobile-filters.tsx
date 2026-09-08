import { getRegion } from "@lib/data/regions"
import { MobileFilterSheet } from "../components/mobile-filter-sheet"
import { getStoreFilterOptions } from "../lib/get-store-filter-options"

export default async function StoreMobileFilters({
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
    <MobileFilterSheet
      categories={categories}
      tags={tags}
      availableColors={availableColors}
      activeCampaigns={activeCampaigns}
      currencySymbol={currencySymbol}
    />
  )
}

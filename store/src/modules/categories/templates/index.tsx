import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/sort-bar"

interface CategoryTemplateProps {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: any
}

import { STYLES as STORE_STYLES } from "../../store/templates/registry"

const CategoryTemplate = async (props: CategoryTemplateProps) => {
  const settings = await getStorefrontSettings()
  const activeStyle = settings.storePage?.template ?? "style-1"
  const formattedStyle = activeStyle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")

  const DynamicComponent =
    STORE_STYLES[formattedStyle] || STORE_STYLES["style-1"]

  if (!DynamicComponent) return null

  return <DynamicComponent {...props} />
}

export default CategoryTemplate

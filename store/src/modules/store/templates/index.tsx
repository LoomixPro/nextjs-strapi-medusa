import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { SortOptions } from "@modules/store/components/sort-bar"
import { STYLES as STORE_STYLES } from "./registry"

interface StoreTemplateProps {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
}

const StoreTemplate = async (props: StoreTemplateProps) => {
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

export default StoreTemplate

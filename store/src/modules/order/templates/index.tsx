import { STYLES } from "./registry"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { HttpTypes } from "@medusajs/types"

interface OrderCompletedTemplateProps {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate(
  props: OrderCompletedTemplateProps
) {
  const settings = await getStorefrontSettings()
  const activeStyle = settings.orderPage?.template ?? "style-1"
  const formattedStyle = activeStyle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")

  const DynamicComponent = STYLES[formattedStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  return <DynamicComponent {...props} />
}

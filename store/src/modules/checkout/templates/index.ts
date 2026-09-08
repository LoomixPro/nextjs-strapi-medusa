import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { STYLES, SUMMARY_STYLES } from "./registry"

export async function getCheckoutSummaryComponent() {
  const settings = await getStorefrontSettings()
  const template = settings?.checkoutPage?.template || "style-1"

  return SUMMARY_STYLES[template] || SUMMARY_STYLES["style-1"]
}

export async function getCheckoutFormComponent() {
  const settings = await getStorefrontSettings()
  const template = settings?.checkoutPage?.template || "style-1"

  return STYLES[template] || STYLES["style-1"]
}

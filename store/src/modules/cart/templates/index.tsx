import { STYLES } from "./registry"
import { getTranslations } from "next-intl/server"
import { HttpTypes } from "@medusajs/types"
import BlockError from "@/modules/home/components/BlockRenderer/block-error"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export default async function CartTemplateResolver({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  const t = await getTranslations("Blocks")

  const settings = await getStorefrontSettings()
  const activeStyle = settings?.cartPage?.template || "style-2"
  const formattedStyle = activeStyle
    ? activeStyle.trim().toLowerCase()
    : "style-2"

  const DynamicComponent = STYLES[formattedStyle] || STYLES["style-1"]

  if (!DynamicComponent) return null

  return (
    <>
      {settings?.cartPage?.topBannerText && (
        <div className="w-full mt-16 bg-primary/5 border-b border-primary/10 text-primary text-center py-3.5 px-4 text-sm font-medium transition-colors duration-200">
          {settings.cartPage.topBannerText}
        </div>
      )}
      <DynamicComponent
        cart={cart}
        customer={customer}
        returnDeadlineDays={settings?.returnDeadlineDays ?? 7}
      />
    </>
  )
}

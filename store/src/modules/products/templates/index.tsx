import React from "react"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { notFound } from "next/navigation"

import { STYLES as PRODUCT_STYLES } from "./registry"

const ProductTemplate: React.FC<ProductTemplateProps> = async (props) => {
  const settings = await getStorefrontSettings()
  const activeStyle = settings.productPage?.template ?? "style-1"
  const formattedStyle = activeStyle
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")

  const DynamicComponent =
    PRODUCT_STYLES[formattedStyle] || PRODUCT_STYLES["style-1"]

  if (!DynamicComponent) {
    console.error(`Product style "${formattedStyle}" resolved to null.`)
    return notFound()
  }

  return <DynamicComponent {...props} />
}

export default ProductTemplate

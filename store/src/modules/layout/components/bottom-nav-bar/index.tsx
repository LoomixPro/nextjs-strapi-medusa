import React from "react"
import { STYLES } from "./registry"
import { HttpTypes } from "@medusajs/types"

export type BottomNavBarProps = {
  className?: string
  stickyBottom?: boolean
  cart?: HttpTypes.StoreCart | null
  hasCategories?: boolean
  categories?: any[]
  navigationData?: any[] | null
  settings?: any
}

const BottomNavBar = async (props: BottomNavBarProps) => {
  // We use settings.header.headerStyle as a fallback if bottomNavBar style is not explicitly defined in Strapi yet
  const style = (props.settings?.bottomNavBar?.style || "style-1")
    .trim()
    .toLowerCase()

  const StyleComponent = STYLES[style] || STYLES["style-1"]

  return <StyleComponent {...props} />
}

export default BottomNavBar

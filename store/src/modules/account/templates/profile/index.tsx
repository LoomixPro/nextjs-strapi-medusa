import { getStorefrontSettings } from "@lib/data/strapi-settings"
import {
  STYLES,
  STYLE_PROFILE_COMPONENTS,
  SHARED_PROFILE_COMPONENTS,
} from "./registry"
import React from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutSwitcherProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
  style?: string
}

export default async function AccountLayoutSwitcher({
  customer,
  children,
  style = "style-1",
}: AccountLayoutSwitcherProps) {
  const Component = STYLES[style] || STYLES["style-1"]

  if (!Component) {
    console.error(`Failed to load Profile Layout style: ${style}`)
    return notFound()
  }

  return <Component customer={customer}>{children}</Component>
}

export async function getProfileComponent(componentName: string) {
  const settings = await getStorefrontSettings()
  const style = settings?.profilePage?.template || "style-1"

  const styleMap = STYLE_PROFILE_COMPONENTS[style]
  if (styleMap && styleMap[componentName]) {
    return styleMap[componentName]
  }

  if (SHARED_PROFILE_COMPONENTS[componentName]) {
    return SHARED_PROFILE_COMPONENTS[componentName]
  }

  console.error(
    `Failed to load Profile Component: ${componentName} from both style ${style} and shared components`
  )
  return null
}

import React from "react"
import { getTranslations } from "next-intl/server"
import { FooterProps } from "./shared"

import { STYLES as FOOTER_STYLES } from "./registry"

const Footer = async ({ settings, footerNavigation, locale }: FooterProps) => {
  const t = await getTranslations("Layout.footer")
  const footer = settings?.footer

  // Match translation for current locale dynamically from Strapi translations list
  const currentLocaleKey = (locale || "default").toLowerCase()
  const matchedTranslation =
    footer?.translations?.find(
      (item) => item.language?.toLowerCase() === currentLocaleKey
    ) ||
    footer?.translations?.find(
      (item) => item.language?.toLowerCase() === "default"
    ) ||
    footer?.translations?.[0]

  const description = matchedTranslation?.description || t("brand_description")

  const copyright = matchedTranslation?.copyright || t("copyright")

  const activeSocialLinks = footer?.socialLinks?.filter((s) => s.enabled) ?? []

  const brandName =
    (footer?.logoLight?.type === "text" && footer.logoLight.text) ||
    (footer?.logoDark?.type === "text" && footer.logoDark.text) ||
    (footer?.logo?.type === "text" && footer.logo.text) ||
    t("brand_name")

  const footerStyle = (footer?.footerStyle || "style-1").trim().toLowerCase()

  const sharedProps = {
    brandName,
    description,
    copyright,
    activeSocialLinks,
    logoLight: footer?.logoLight,
    logoDark: footer?.logoDark,
    logo: footer?.logo,
    footerNavigation,
  }

  const DynamicComponent =
    FOOTER_STYLES[footerStyle] || FOOTER_STYLES["style-1"]

  if (!DynamicComponent) return null

  return <DynamicComponent {...sharedProps} />
}

export default Footer

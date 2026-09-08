"use client"

import React from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { clx } from "@medusajs/ui"

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337"

export const FooterLogo = ({
  logoLight,
  logoDark,
  logo,
  textClassName = "text-foreground",
}: {
  logoLight?: any
  logoDark?: any
  logo?: any
  textClassName?: string
}) => {
  const t = useTranslations("Layout.footer")
  const light = logoLight || logo
  const dark = logoDark || logo

  if (!light && !dark) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-xl">
          {t("brand_name").charAt(0)}
        </div>
        <span className={`text-2xl font-bold ${textClassName} tracking-tight`}>
          {t("brand_name")}
        </span>
      </div>
    )
  }

  const renderLogo = (logoConfig: any, isDark: boolean) => {
    if (!logoConfig) return null

    if (logoConfig.type === "text" && logoConfig.text) {
      return (
        <div
          className={clx(
            "items-center gap-2",
            isDark ? "hidden dark:flex" : "flex dark:hidden"
          )}
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-xl">
            {logoConfig.text.charAt(0)}
          </div>
          <span
            className={`text-2xl font-bold ${textClassName} tracking-tight`}
          >
            {logoConfig.text}
          </span>
        </div>
      )
    }

    if (logoConfig.type === "image" && logoConfig.image) {
      let imageUrl = ""
      const img = logoConfig.image
      if ("data" in img && img.data?.attributes?.url) {
        imageUrl = img.data.attributes.url
      } else if ("url" in img && img.url) {
        imageUrl = img.url
      }
      if (imageUrl) {
        if (!imageUrl.startsWith("http")) imageUrl = `${STRAPI_URL}${imageUrl}`
        return (
          <Image
            src={imageUrl}
            alt="Logo"
            width={160}
            height={48}
            className={clx(
              "h-12 w-auto object-contain",
              isDark ? "hidden dark:block" : "dark:hidden"
            )}
          />
        )
      }
    }

    return null
  }

  return (
    <div className="flex items-center">
      {renderLogo(light, false)}
      {renderLogo(dark, true)}
    </div>
  )
}

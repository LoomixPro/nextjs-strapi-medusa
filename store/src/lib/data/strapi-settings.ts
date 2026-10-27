import { cache } from "react"
import { cacheLife, cacheTag } from "next/cache"
import { fetchWithRetry } from "@lib/util/fetch-retry"
import { getStrapiServerUrl } from "@lib/util/server-urls"
import type { ProductCardType } from "@modules/products/components/product-cards"
import { setClientSettings } from "@lib/util/storefront-settings"

export interface TranslationEntry {
  language: string
  file?: {
    url: string
  }
}

export type SocialPlatform =
  | "twitter"
  | "github"
  | "linkedin"
  | "facebook"
  | "instagram"
  | "youtube"
  | "telegram"
  | "whatsapp"
  | "tiktok"
  | "pinterest"
  | "snapchat"
  | "reddit"
  | "discord"

export interface SocialLink {
  id?: number
  platform: SocialPlatform
  url: string
  enabled?: boolean
}

export interface LogoConfig {
  type?: "image" | "text"
  image?: { data?: { attributes?: { url: string } } } | { url: string }
  text?: string
  url?: string
  alternativeText?: string
  width?: number
  height?: number
}

export interface FooterTranslation {
  id?: number
  language: string
  description?: string
  copyright?: string
}

export interface FooterSettings {
  footerStyle?: string
  logoLight?: LogoConfig | any
  logoDark?: LogoConfig | any
  logo?: LogoConfig | any
  translations?: FooterTranslation[]
  socialLinks?: SocialLink[]
}

export interface StorefrontSettings {
  productCard: {
    storeCardType: ProductCardType
    collectionCardType: ProductCardType
    categoryCardType: ProductCardType
  }
  header?: {
    headerStyle: string
    logoLight?: LogoConfig | any
    logoDark?: LogoConfig | any
  }
  productPage?: {
    template: string
  }
  checkoutPage?: {
    template: string
  }
  storePage?: {
    template: string
    title?: string
    description?: string
  }
  orderPage?: {
    template: string
  }
  cartPage?: {
    template: string
    topBannerText?: string
  }
  loginPage?: {
    template: string
    loginMethods?: "email" | "phone" | "both"
    images?: any[]
  }
  profilePage?: {
    template: string
  }
  footer?: FooterSettings
  bottomNavBar?: {
    style: string
  }
  translations?: TranslationEntry[]
  isRtl?: boolean
  convertToToman?: boolean
  timeZone?: string
  background?: {
    style: "silk" | "grid" | "solid" | "none"
    opacityLight?: number
    opacityDark?: number
  }
  button?: {
    style: string
  }
  theme?: {
    lightPalette: "default" | "emerald" | "violet" | "blue" | "rose" | "amber"
    darkPalette: "default" | "slate" | "zinc" | "indigo" | "emerald" | "violet"
  }
  siteName?: string
  siteDescription?: string
  favicon?: {
    url: string
    alternativeText?: string
    width?: number
    height?: number
  }
  returnDeadlineDays?: number
  allowIndexing?: boolean
}

const STRAPI_URL = getStrapiServerUrl()
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

import defaultSettingsPreset from "@lib/config/storefront-settings.json"

export async function getDefaultStorefrontSettings(): Promise<StorefrontSettings> {
  const preset = defaultSettingsPreset as unknown as StorefrontSettings
  return {
    ...preset,
    timeZone:
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ||
      process.env.DEFAULT_TIMEZONE ||
      preset.timeZone ||
      "UTC",
  }
}

/**
 * Fetch storefront settings from Strapi CMS
 * Cached per request using React cache()
 */
export const getStorefrontSettings = async (
  status: "draft" | "published" = "published"
): Promise<StorefrontSettings> => {
  if (status === "draft") {
    return _fetchStorefrontSettings(status)
  }
  return _cachedStorefrontSettings(status)
}

async function _cachedStorefrontSettings(
  status: "draft" | "published"
): Promise<StorefrontSettings> {
  "use cache"
  cacheTag("strapi-settings")

  try {
    const settings = await _fetchStorefrontSettings(status)
    cacheLife("days")
    return settings
  } catch (error) {
    console.warn(
      "Strapi unreachable during cache evaluation, using temporary seconds fallback:",
      error instanceof Error ? error.message : error
    )
    cacheLife("minutes")
    return await getDefaultStorefrontSettings()
  }
}

async function _fetchStorefrontSettings(
  status: "draft" | "published"
): Promise<StorefrontSettings> {
  const response = await fetchWithRetry(
    `${STRAPI_URL}/api/storefront-settings?status=${status}&populate[modules][populate]=*&populate[translations][populate]=*&populate[favicon]=true`,
    {
      headers: {
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    }
  )

  // If settings don't exist yet (404) or unauthenticated (401/403 on fresh setup), return defaults
  if (
    response.status === 404 ||
    response.status === 401 ||
    response.status === 403
  ) {
    return await getDefaultStorefrontSettings()
  }

  if (!response.ok) {
    throw new Error(`Strapi settings fetch failed: ${response.status}`)
  }

  const { data } = await response.json()

  const modulesObj: any = {}
  if (Array.isArray(data?.modules)) {
    for (const mod of data.modules) {
      switch (mod.__component) {
        case "settings.product-card-selection":
          modulesObj.productCard = mod
          break
        case "settings.header-settings":
          modulesObj.header = mod
          break
        case "settings.product-page-settings":
          modulesObj.productPage = mod
          break
        case "settings.checkout-page-settings":
          modulesObj.checkoutPage = mod
          break
        case "settings.store-page-settings":
          modulesObj.storePage = mod
          break
        case "settings.order-page-settings":
          modulesObj.orderPage = mod
          break
        case "settings.cart-page-settings":
          modulesObj.cartPage = mod
          break
        case "settings.login-page-settings":
          modulesObj.loginPage = mod
          break
        case "settings.footer-settings":
          modulesObj.footer = mod
          break
        case "settings.profile-page-settings":
          modulesObj.profilePage = mod
          break
        case "settings.bottom-nav-bar-settings":
          modulesObj.bottomNavBar = mod
          break
        case "settings.background-settings":
          modulesObj.background = mod
          break
        case "settings.button-settings":
          modulesObj.button = mod
          break
        case "settings.theme-settings":
          modulesObj.theme = mod
          break
      }
    }
  }

  const settings: StorefrontSettings = {
    productCard: {
      storeCardType: modulesObj.productCard?.storeCardType || "card-1",
      collectionCardType:
        modulesObj.productCard?.collectionCardType || "card-1",
      categoryCardType: modulesObj.productCard?.categoryCardType || "card-1",
    },
    header: modulesObj.header
      ? {
          headerStyle: modulesObj.header.headerStyle || "style-1",
          logoLight: modulesObj.header.logoLight,
          logoDark: modulesObj.header.logoDark,
        }
      : undefined,
    productPage: {
      template: modulesObj.productPage?.template || "style-1",
    },
    checkoutPage: {
      template: modulesObj.checkoutPage?.template || "style-1",
    },
    storePage: {
      template: modulesObj.storePage?.template || "style-1",
      title: modulesObj.storePage?.title,
      description: modulesObj.storePage?.description,
    },
    orderPage: {
      template: modulesObj.orderPage?.template || "style-1",
    },
    cartPage: {
      template: modulesObj.cartPage?.template || "style-1",
      topBannerText: modulesObj.cartPage?.topBannerText,
    },
    loginPage: {
      template: modulesObj.loginPage?.template || "style-1",
      loginMethods: modulesObj.loginPage?.loginMethods || "email",
      images: modulesObj.loginPage?.images?.map((img: any) =>
        img.url?.startsWith("http") ? img.url : `${STRAPI_URL}${img.url}`
      ),
    },
    profilePage: {
      template: modulesObj.profilePage?.template || "style-1",
    },
    bottomNavBar: modulesObj.bottomNavBar
      ? {
          style: modulesObj.bottomNavBar.style || "style-1",
        }
      : undefined,
    footer: modulesObj.footer
      ? {
          footerStyle: modulesObj.footer.footerStyle || "style-1",
          logoLight: modulesObj.footer.logoLight || modulesObj.footer.logo,
          logoDark: modulesObj.footer.logoDark || modulesObj.footer.logo,
          logo: modulesObj.footer.logo,
          translations: modulesObj.footer.translations || [],
          socialLinks: modulesObj.footer.socialLinks || [],
        }
      : undefined,
    background: modulesObj.background
      ? {
          style: modulesObj.background.style || "grid",
          opacityLight: modulesObj.background.opacityLight ?? 40,
          opacityDark: modulesObj.background.opacityDark ?? 30,
        }
      : undefined,
    button: modulesObj.button
      ? {
          style: modulesObj.button.style || "style-1",
        }
      : undefined,
    theme: modulesObj.theme
      ? {
          lightPalette: modulesObj.theme.lightPalette || "default",
          darkPalette: modulesObj.theme.darkPalette || "default",
        }
      : {
          lightPalette: "default",
          darkPalette: "default",
        },
    isRtl: data?.isRtl ?? false,
    convertToToman: data?.convertToToman ?? false,
    translations: data?.translations || [],
    timeZone:
      data?.timeZone ||
      process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ||
      process.env.DEFAULT_TIMEZONE ||
      "UTC",
    siteName:
      data?.siteName ||
      process.env.NEXT_PUBLIC_SITE_NAME ||
      (defaultSettingsPreset as any).siteName ||
      "Loomix",
    siteDescription:
      data?.siteDescription ||
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      (defaultSettingsPreset as any).siteDescription ||
      "",
    favicon: data?.favicon?.url
      ? {
          url: data.favicon.url,
          alternativeText: data.favicon.alternativeText,
          width: data.favicon.width,
          height: data.favicon.height,
        }
      : undefined,
    returnDeadlineDays: data?.returnDeadlineDays ?? 7,
    allowIndexing: data?.allowIndexing ?? true,
  }

  if (typeof window !== "undefined") {
    setClientSettings(settings)
  }
  return settings
}

/**
 * Normalizes any locale string to standard 4-letter BCP-47 locale format (e.g. 'fa-IR', 'en-US', 'ar-AE').
 * Strictly expects 4-letter compound codes. If a 2-letter or invalid code is supplied,
 * logs an error and falls back to the default locale.
 */
function normalizeLocaleCode(locale?: string | null): string {
  const defaultLocale =
    process.env.DEFAULT_LOCALE ||
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    "en-US"

  if (!locale || locale === "default") {
    return defaultLocale
  }

  const trimmed = locale.trim()

  // Standard 4-letter compound format (e.g. fa-IR, en-US, ar-AE with hyphen or underscore)
  if (trimmed.includes("-") || trimmed.includes("_")) {
    const [lang, region] = trimmed.replace("_", "-").split("-")
    if (lang && region && lang.length === 2 && region.length === 2) {
      return `${lang.toLowerCase()}-${region.toUpperCase()}`
    }
  }

  // If a 2-letter or invalid locale is entered, log an error and fall back to default
  console.error(
    `[i18n] Invalid locale '${trimmed}'. Locales must strictly be 4-letter compound codes (e.g. 'fa-IR', 'en-US'). Falling back to default locale '${defaultLocale}'.`
  )
  return defaultLocale
}

/**
 * Fetch translation messages for a specific locale from Strapi.
 * Falls back to local message files if Strapi has no translation for the locale.
 */
export async function getTranslationMessages(
  locale: string
): Promise<Record<string, string> | null> {
  const targetLocale = normalizeLocaleCode(locale)
  return _cachedTranslationMessages(targetLocale)
}

async function _cachedTranslationMessages(
  locale: string
): Promise<Record<string, string> | null> {
  "use cache"
  const targetLocale = normalizeLocaleCode(locale)
  cacheTag(
    "strapi-settings",
    "translation-messages",
    `translation-messages-${targetLocale}`
  )

  try {
    const settings = await getStorefrontSettings()
    const translations = settings.translations || []
    const entry = translations.find(
      (t) =>
        t.language &&
        normalizeLocaleCode(t.language).toLowerCase() ===
          targetLocale.toLowerCase()
    )

    if (!entry?.file?.url) {
      cacheLife("days")
      return null
    }

    // Build full URL for the file
    const fileUrl = entry.file.url.startsWith("http")
      ? entry.file.url
      : `${STRAPI_URL}${entry.file.url}`

    const response = await fetch(fileUrl)
    if (!response.ok) {
      if (response.status === 404) {
        cacheLife("days")
        return null
      }
      throw new Error(
        `Failed to fetch translation file for locale '${targetLocale}': ${response.status}`
      )
    }

    cacheLife("days")
    return await response.json()
  } catch (error) {
    cacheLife("minutes")
    return null
  }
}

export interface TranslationItem {
  id: number
  language: string
  value: string
}

export interface DictionaryEntry {
  id: number
  key: string
  translations?: TranslationItem[]
}

/**
 * Fetch all dictionary entries from Strapi and map them to a key-value object
 * for the requested locale. Always checks against the 4-letter locale format.
 */
export async function getDictionaryMap(
  locale: string
): Promise<Record<string, string>> {
  const targetLocale = normalizeLocaleCode(locale)
  return _cachedDictionaryMap(targetLocale)
}

async function _cachedDictionaryMap(
  locale: string
): Promise<Record<string, string>> {
  "use cache"
  const targetLocale = normalizeLocaleCode(locale)
  cacheTag(
    "strapi-settings",
    "strapi-dictionary",
    `strapi-dictionary-${targetLocale}`
  )

  try {
    const url = `${STRAPI_URL}/api/dictionary-entries?populate[translations]=*`
    const response = await fetchWithRetry(url, {
      headers: {
        ...(STRAPI_API_TOKEN && {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        cacheLife("days")
        return {}
      }
      throw new Error(`Strapi dictionary fetch failed: ${response.status}`)
    }

    const { data } = await response.json()
    const map: Record<string, string> = {}

    if (Array.isArray(data)) {
      data.forEach((entry: any) => {
        const key = entry.key
        if (!key) return

        // Always strictly check 4-letter locale format (e.g. "fa-IR", "en-US")
        const translation = entry.translations?.find(
          (t: any) =>
            t.language &&
            normalizeLocaleCode(t.language).toLowerCase() ===
              targetLocale.toLowerCase()
        )

        if (translation) {
          map[key] = translation.value
        }
      })
    }

    cacheLife("days")
    return map
  } catch (error) {
    cacheLife("minutes")
    return {}
  }
}

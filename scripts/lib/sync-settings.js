const fs = require("fs")
const path = require("path")
const { resolveProjectRoot } = require("./resolve-project-root")

/**
 * Simple .env file loader helper
 */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const env = {}
    for (const line of content.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const idx = trimmed.indexOf("=")
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim()
        let val = trimmed.slice(idx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        env[key] = val
      }
    }
    return env
  } catch {
    return {}
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Synchronize storefront-settings from Strapi into store/src/lib/config/storefront-settings.json
 */
async function syncSettings(options = {}) {
  const projectRoot = options.projectRoot || resolveProjectRoot()
  const storeDir = path.join(projectRoot, "store")
  const configDir = path.join(storeDir, "src", "lib", "config")
  const targetJsonPath = path.join(configDir, "storefront-settings.json")

  const rootEnv = loadEnvFile(path.join(projectRoot, ".env"))
  const storeEnv = loadEnvFile(path.join(storeDir, ".env"))
  const adminEnv = loadEnvFile(path.join(projectRoot, "website-admin", ".env"))
  const storeAdminEnv = loadEnvFile(path.join(projectRoot, "store-admin", ".env"))

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  const strapiUrl = (
    options.strapiUrl ||
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    storeEnv.NEXT_PUBLIC_STRAPI_URL ||
    storeEnv.STRAPI_URL ||
    rootEnv.STRAPI_URL ||
    "http://localhost:1337"
  ).replace(/\/$/, "")

  const strapiToken =
    options.strapiToken ||
    process.env.STRAPI_API_TOKEN ||
    storeEnv.STRAPI_API_TOKEN ||
    adminEnv.STRAPI_API_TOKEN ||
    storeAdminEnv.STRAPI_API_TOKEN ||
    rootEnv.STRAPI_API_TOKEN ||
    rootEnv.STRAPI_API_TOKEN_FOR_MEDUSA ||
    storeEnv.STRAPI_API_TOKEN_FOR_FRONT ||
    ""

  console.log(`[sync-settings] Connecting to Strapi at: ${strapiUrl}`)

  const endpoint = `${strapiUrl}/api/storefront-settings?status=published&populate[modules][populate]=*&populate[translations][populate]=*`
  const headers = {
    "Content-Type": "application/json"
  }
  if (strapiToken) {
    headers["Authorization"] = `Bearer ${strapiToken}`
  }

  const response = await fetchWithTimeout(endpoint, { headers }, 10000)
  if (!response.ok) {
    throw new Error(`Failed to fetch storefront settings from Strapi: ${response.status} ${response.statusText}`)
  }

  const json = await response.json()
  const data = json?.data || {}

  const modulesObj = {}
  if (Array.isArray(data.modules)) {
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

  const settingsPreset = {
    productCard: {
      storeCardType: modulesObj.productCard?.storeCardType || "card-1",
      collectionCardType: modulesObj.productCard?.collectionCardType || "card-1",
      categoryCardType: modulesObj.productCard?.categoryCardType || "card-1",
    },
    header: modulesObj.header
      ? {
          headerStyle: modulesObj.header.headerStyle || "style-1",
          logoLight: modulesObj.header.logoLight,
          logoDark: modulesObj.header.logoDark,
        }
      : { headerStyle: "style-1" },
    productPage: {
      template: modulesObj.productPage?.template || "style-1",
    },
    checkoutPage: {
      template: modulesObj.checkoutPage?.template || "style-1",
    },
    storePage: {
      template: modulesObj.storePage?.template || "style-1",
      title: modulesObj.storePage?.title || "All Products",
      description: modulesObj.storePage?.description || "Explore our complete collection of premium fashion essentials.",
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
    },
    profilePage: {
      template: modulesObj.profilePage?.template || "style-1",
    },
    bottomNavBar: {
      style: modulesObj.bottomNavBar?.style || "style-3",
    },
    footer: modulesObj.footer
      ? {
          footerStyle: modulesObj.footer.footerStyle || "style-1",
          logoLight: modulesObj.footer.logoLight,
          logoDark: modulesObj.footer.logoDark,
          translations: modulesObj.footer.translations || [],
          socialLinks: modulesObj.footer.socialLinks || [],
        }
      : { footerStyle: "style-1" },
    background: modulesObj.background
      ? {
          style: modulesObj.background.style || "none",
          opacityLight: modulesObj.background.opacityLight ?? 40,
          opacityDark: modulesObj.background.opacityDark ?? 30,
        }
      : { style: "none", opacityLight: 40, opacityDark: 30 },
    button: {
      style: modulesObj.button?.style || "style-1",
    },
    theme: modulesObj.theme
      ? {
          lightPalette: modulesObj.theme.lightPalette || "default",
          darkPalette: modulesObj.theme.darkPalette || "default",
        }
      : { lightPalette: "default", darkPalette: "default" },
    isRtl: data.isRtl ?? false,
    convertToToman: data.convertToToman ?? false,
    returnDeadlineDays: data.returnDeadlineDays ?? 7,
    allowIndexing: data.allowIndexing ?? true,
    timeZone: data.timeZone || "UTC",
    translations: data.translations || [],
  }

  fs.writeFileSync(targetJsonPath, JSON.stringify(settingsPreset, null, 2) + "\n", "utf8")
  console.log(`[sync-settings] Successfully saved storefront settings preset to:\n  -> ${targetJsonPath}`)

  return {
    success: true,
    targetJsonPath,
    settings: settingsPreset,
  }
}

module.exports = {
  syncSettings,
}

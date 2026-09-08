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
 * Fetch with optional timeout and error handling.
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
 * Synchronize translation files from Strapi to the store/messages directory
 * and automatically generate store/src/lib/i18n/messages-registry.ts.
 */
async function syncTranslations(options = {}) {
  const projectRoot = options.projectRoot || resolveProjectRoot()
  const storeDir = path.join(projectRoot, "store")
  const websiteAdminDir = path.join(projectRoot, "website-admin")
  const messagesDir = path.join(storeDir, "messages")
  const registryFilePath = path.join(storeDir, "src", "lib", "i18n", "messages-registry.ts")

  const storeEnv = loadEnvFile(path.join(storeDir, ".env"))
  const adminEnv = loadEnvFile(path.join(websiteAdminDir, ".env"))

  if (!fs.existsSync(messagesDir)) {
    fs.mkdirSync(messagesDir, { recursive: true })
  }

  const strapiUrl = (
    options.strapiUrl ||
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    storeEnv.NEXT_PUBLIC_STRAPI_URL ||
    storeEnv.STRAPI_URL ||
    "http://localhost:1337"
  ).replace(/\/$/, "")

  const strapiToken =
    options.strapiToken ||
    process.env.STRAPI_API_TOKEN ||
    storeEnv.STRAPI_API_TOKEN ||
    adminEnv.STRAPI_API_TOKEN ||
    ""

  const syncedLocales = []
  let strapiSyncedCount = 0

  console.log(`[Translation Sync] Checking Strapi at: ${strapiUrl}`)

  try {
    const headers = {
      "Content-Type": "application/json",
    }
    if (strapiToken) {
      headers["Authorization"] = `Bearer ${strapiToken}`
    }

    const apiUrl = `${strapiUrl}/api/storefront-settings?populate[translations][populate]=*`
    const res = await fetchWithTimeout(apiUrl, { headers }, 8000)

    if (res.ok) {
      const data = await res.json()
      const settings = data?.data?.attributes || data?.data || {}
      const translations = settings.translations || []

      console.log(`[Translation Sync] Found ${translations.length} translation entries in Strapi.`)

      for (const entry of translations) {
        const lang = entry.language ? entry.language.trim() : null
        const fileUrl = entry.file?.url

        if (!lang || !fileUrl) {
          continue
        }

        const fullFileUrl = fileUrl.startsWith("http") ? fileUrl : `${strapiUrl}${fileUrl}`
        console.log(`[Translation Sync] Downloading translation for '${lang}' from ${fullFileUrl}...`)

        try {
          const fileRes = await fetchWithTimeout(fullFileUrl, {}, 10000)
          if (fileRes.ok) {
            const jsonContent = await fileRes.json()
            const targetPath = path.join(messagesDir, `${lang}.json`)
            fs.writeFileSync(targetPath, JSON.stringify(jsonContent, null, 2), "utf8")
            console.log(`[Translation Sync] Saved: store/messages/${lang}.json`)
            syncedLocales.push(lang)
            strapiSyncedCount++
          } else {
            console.warn(`[Translation Sync] Failed to download file for '${lang}' (HTTP ${fileRes.status})`)
          }
        } catch (downloadErr) {
          console.warn(`[Translation Sync] Error downloading translation for '${lang}':`, downloadErr.message)
        }
      }
    } else {
      console.log(`[Translation Sync] Strapi endpoint returned HTTP ${res.status}. Falling back to local messages directory.`)
    }
  } catch (err) {
    console.log(`[Translation Sync] Could not reach Strapi (${err.message}). Using local message files.`)
  }

  // Scan all existing JSON message files in store/messages/
  const existingFiles = fs
    .readdirSync(messagesDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."))

  const localeMap = new Map()

  for (const file of existingFiles) {
    const localeName = path.basename(file, ".json")
    if (localeName !== "default") {
      localeMap.set(localeName, file)
    }
  }

  // Generate messages-registry.ts
  const registryLines = [
    "/**",
    " * AUTO-GENERATED FILE by scripts/sync-translations.js",
    " * DO NOT EDIT MANUALLY.",
    " */",
    "",
    'import defaultMessages from "../../../messages/default.json"',
    "",
    "export type MessageLoader = () => Promise<{ default: Record<string, unknown> }>",
    "",
    "export const LOCAL_MESSAGE_LOADERS: Record<string, MessageLoader> = {",
    '  default: () => Promise.resolve({ default: defaultMessages as unknown as Record<string, unknown> }),',
  ]

  for (const [locale, fileName] of localeMap.entries()) {
    registryLines.push(`  "${locale}": () => import("../../../messages/${fileName}"),`)
  }

  registryLines.push("}")
  registryLines.push("")

  const allLocalesArray = Array.from(localeMap.keys())
  registryLines.push(`export const AVAILABLE_LOCALES: string[] = ${JSON.stringify(allLocalesArray, null, 2)}`)
  registryLines.push("")
  registryLines.push("export function getAvailableLocales(): string[] {")
  registryLines.push("  return AVAILABLE_LOCALES")
  registryLines.push("}")
  registryLines.push("")
  registryLines.push("export function isLocaleAvailable(locale: string): boolean {")
  registryLines.push("  return locale in LOCAL_MESSAGE_LOADERS")
  registryLines.push("}")
  registryLines.push("")

  const registryDir = path.dirname(registryFilePath)
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true })
  }

  fs.writeFileSync(registryFilePath, registryLines.join("\n"), "utf8")
  console.log(`[Translation Sync] Successfully generated registry: store/src/lib/i18n/messages-registry.ts with ${allLocalesArray.length} locales.`)

  return {
    success: true,
    strapiSyncedCount,
    totalLocales: allLocalesArray.length,
    locales: allLocalesArray,
    registryPath: registryFilePath,
  }
}

module.exports = { syncTranslations }

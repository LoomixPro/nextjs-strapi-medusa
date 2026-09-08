#!/usr/bin/env node

const { syncTranslations } = require("./lib/sync-translations")

async function run() {
  try {
    console.log("=== Starting Storefront Translation Sync ===")
    const result = await syncTranslations()
    console.log("=== Translation Sync Complete ===")
    console.log(`Synced from Strapi: ${result.strapiSyncedCount}`)
    console.log(`Total active locales: ${result.totalLocales} (${result.locales.join(", ")})`)
  } catch (error) {
    console.error("[Translation Sync Error]:", error)
    process.exitCode = 1
  }
}

run()

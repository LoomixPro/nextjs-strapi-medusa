#!/usr/bin/env node

const { syncSettings } = require("./lib/sync-settings")

async function main() {
  try {
    await syncSettings()
    console.log("Storefront settings preset synchronization completed successfully.")
  } catch (error) {
    console.error("Storefront settings synchronization failed:", error.message)
    process.exitCode = 1
  }
}

main()

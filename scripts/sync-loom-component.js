#!/usr/bin/env node

const { execSync } = require("child_process")
const path = require("path")
const { syncLoomComponent, resolveProjectRoot } = require("./lib/sync-loom-component")

async function main() {
  const [action = "add", componentPath] = process.argv.slice(2)

  if (!componentPath || !["add", "remove"].includes(action)) {
    console.error("Usage: node scripts/sync-loom-component.js <add|remove> <component-path>")
    console.error("Example: node scripts/sync-loom-component.js add home/components/FeaturesBlock/style-4")
    process.exit(1)
  }

  const projectRoot = resolveProjectRoot()
  const result = await syncLoomComponent(action, componentPath, { projectRoot })

  if (action === "remove") {
    console.log(
      result.deleted
        ? `Removed '${componentPath}' from storefront modules.`
        : `Component '${componentPath}' was not present.`
    )
  } else {
    console.log(`Synced '${componentPath}' (${result.mode}) to ${result.target}`)
  }

  const registryScript = path.join(projectRoot, "store", "scripts", "generate-style-registries.js")
  execSync(`node "${registryScript}"`, {
    cwd: projectRoot,
    stdio: "inherit",
  })

  console.log("Style registries regenerated.")
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})

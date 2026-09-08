const c = require("ansi-colors")

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    // TODO: we need a good doc to point this to
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
]

function checkEnvVariables() {
  const missingEnvs = requiredEnvs.filter(function (env) {
    return !process.env[env.key]
  })

  if (missingEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing required environment variables\n")
    )

    missingEnvs.forEach(function (env) {
      console.error(c.yellow(`  ${c.bold(env.key)}`))
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`))
      }
    })

    console.error(
      c.yellow(
        "\nPlease set these variables in your .env file or environment before starting the application.\n"
      )
    )

    process.exit(1)
  }

  warnIfMeilisearchKeysMatch()
}

function warnIfMeilisearchKeysMatch() {
  const master = process.env.MEILI_MASTER_KEY
  const search =
    process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ||
    process.env.MEILI_SEARCH_KEY

  if (
    process.env.NODE_ENV === "production" &&
    master &&
    search &&
    master === search
  ) {
    console.warn(
      c.yellow.bold(
        "\n⚠ Warning: Meilisearch search key equals master key. Use a search-only key in MEILI_SEARCH_KEY / NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY.\n"
      )
    )
  }
}

module.exports = checkEnvVariables

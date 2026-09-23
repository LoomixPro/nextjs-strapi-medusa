import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"
import { instantMeiliSearch } from "@meilisearch/instant-meilisearch"
// Defaults to standard port for Medusa server
export const MEDUSA_BACKEND_URL =
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"

/**
 * Initialize the Medusa JS SDK.
 * Used for communicating with the Medusa backend.
 */
export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: false, // Disabled verbose SDK logging in development
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "jwt",
  },
})

// Custom fetch wrapper removed to prevent implicit cookie access during static prerendering

/**
 * Initialize the Meilisearch client for InstantSearch.
 * Used for fast and typo-tolerant product searches.
 */
export const { searchClient } = instantMeiliSearch(
  process.env.MEILISEARCH_HOST ||
    process.env.NEXT_PUBLIC_MEILISEARCH_HOST ||
    "",
  process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY || "",
  { primaryKey: "id" }
)

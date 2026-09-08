function normalizeBaseUrl(url: string): string {
  return url.replace(/\/api\/?$/, "").replace(/\/$/, "")
}

/** Public Strapi URL for media/links rendered in the browser. */
export function getStrapiPublicUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    process.env.STRAPI_URL ||
    "http://localhost:1337"

  return normalizeBaseUrl(raw)
}

/** Strapi URL for server-side API fetches (prefer internal Docker URL when set). */
export function getStrapiServerUrl(): string {
  const raw =
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    "http://localhost:1337"

  return normalizeBaseUrl(raw)
}

/** Umami URL for server-side API calls (prefer internal Docker URL when set). */
export function getUmamiServerUrl(): string {
  const raw =
    process.env.UMAMI_URL ||
    process.env.NEXT_PUBLIC_UMAMI_URL ||
    "http://localhost:3000"

  return raw.replace(/\/$/, "")
}

/** Meilisearch URL for server-side API fetches (prefer internal Docker URL when set). */
export function getMeilisearchServerUrl(): string {
  const raw =
    process.env.MEILISEARCH_HOST ||
    process.env.NEXT_PUBLIC_MEILISEARCH_HOST ||
    "http://localhost:7700"

  return raw.replace(/\/$/, "")
}

/**
 * Meilisearch API key for server-side requests.
 * Prefers server-only env vars so SSR never relies on NEXT_PUBLIC keys when
 * an internal key is configured (avoids using a master key from the browser bundle).
 */
export function getMeilisearchServerApiKey(): string {
  return (
    process.env.MEILISEARCH_API_KEY ||
    process.env.MEILI_SEARCH_KEY ||
    process.env.MEILI_MASTER_KEY ||
    process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY ||
    ""
  )
}

/** Meilisearch index name for server-side queries. */
export function getMeilisearchIndexName(): string {
  return (
    process.env.MEILISEARCH_PRODUCT_INDEX_NAME ||
    process.env.MEILISEARCH_INDEX_NAME ||
    process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME ||
    "products"
  )
}

/** Warn when Meilisearch search key equals master key (unsafe for browser exposure). */
export function warnIfMeilisearchKeysMatch(): void {
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
      "[security] Meilisearch search key equals master key. Generate a search-only key and set MEILI_SEARCH_KEY / NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY."
    )
  }
}

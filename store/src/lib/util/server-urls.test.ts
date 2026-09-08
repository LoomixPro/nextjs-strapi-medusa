import {
  getMeilisearchIndexName,
  getMeilisearchServerApiKey,
  getMeilisearchServerUrl,
  getStrapiPublicUrl,
  getStrapiServerUrl,
  getUmamiServerUrl,
} from "./server-urls"

describe("server-urls", () => {
  const env = process.env

  beforeEach(() => {
    process.env = { ...env }
  })

  afterAll(() => {
    process.env = env
  })

  it("getStrapiServerUrl prefers STRAPI_URL over public URL", () => {
    process.env.STRAPI_URL = "http://strapi:1337"
    process.env.NEXT_PUBLIC_STRAPI_URL = "https://admin.example.com"

    expect(getStrapiServerUrl()).toBe("http://strapi:1337")
  })

  it("getStrapiPublicUrl prefers NEXT_PUBLIC_STRAPI_URL", () => {
    process.env.STRAPI_URL = "http://strapi:1337"
    process.env.NEXT_PUBLIC_STRAPI_URL = "https://admin.example.com"

    expect(getStrapiPublicUrl()).toBe("https://admin.example.com")
  })

  it("getUmamiServerUrl prefers UMAMI_URL over public URL", () => {
    process.env.UMAMI_URL = "http://umami:3000"
    process.env.NEXT_PUBLIC_UMAMI_URL = "https://analytics.example.com"

    expect(getUmamiServerUrl()).toBe("http://umami:3000")
  })

  it("getMeilisearchServerUrl prefers MEILISEARCH_HOST over public URL", () => {
    process.env.MEILISEARCH_HOST = "http://meilisearch:7700"
    process.env.NEXT_PUBLIC_MEILISEARCH_HOST = "https://search.example.com"

    expect(getMeilisearchServerUrl()).toBe("http://meilisearch:7700")
  })

  it("getMeilisearchServerApiKey prefers server-only key over NEXT_PUBLIC", () => {
    process.env.MEILISEARCH_API_KEY = "server-master-key"
    process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY = "public-search-key"

    expect(getMeilisearchServerApiKey()).toBe("server-master-key")
  })

  it("getMeilisearchServerApiKey falls back to MEILI_SEARCH_KEY then public search key", () => {
    delete process.env.MEILISEARCH_API_KEY
    delete process.env.MEILI_MASTER_KEY
    process.env.MEILI_SEARCH_KEY = "search-only-key"
    process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY = "public-search-key"

    expect(getMeilisearchServerApiKey()).toBe("search-only-key")
  })

  it("getMeilisearchIndexName prefers server env over NEXT_PUBLIC", () => {
    process.env.MEILISEARCH_PRODUCT_INDEX_NAME = "products-prod"
    process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME = "products"

    expect(getMeilisearchIndexName()).toBe("products-prod")
  })
})

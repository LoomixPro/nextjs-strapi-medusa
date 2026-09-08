import {
  resolveAdminCors,
  resolveAuthCors,
  resolveCors,
  resolveStoreCors,
  uniqueCorsOrigins,
} from "../resolve-cors"

describe("resolve-cors", () => {
  it("uniqueCorsOrigins deduplicates comma-separated values", () => {
    expect(
      uniqueCorsOrigins(
        "https://store.example.com",
        "https://store.example.com,http://localhost:8000"
      )
    ).toBe("https://store.example.com,http://localhost:8000")
  })

  it("resolveCors prefers explicit primary value", () => {
    expect(
      resolveCors(
        "https://store.example.com",
        "https://fallback.example.com"
      )
    ).toBe("https://store.example.com")
  })

  it("resolveStoreCors falls back to STOREFRONT_PUBLIC_URL", () => {
    expect(
      resolveStoreCors({
        STOREFRONT_PUBLIC_URL: "https://yourdomain.com",
        NODE_ENV: "production",
      })
    ).toBe("https://yourdomain.com")
  })

  it("resolveAdminCors merges backend and Strapi public URLs", () => {
    expect(
      resolveAdminCors({
        MEDUSA_BACKEND_PUBLIC_URL: "https://api.yourdomain.com",
        STRAPI_PUBLIC_URL: "https://admin.yourdomain.com",
        NODE_ENV: "production",
      })
    ).toBe("https://api.yourdomain.com,https://admin.yourdomain.com")
  })

  it("resolveAuthCors includes storefront and backend URLs", () => {
    expect(
      resolveAuthCors({
        STOREFRONT_PUBLIC_URL: "https://yourdomain.com",
        MEDUSA_BACKEND_PUBLIC_URL: "https://api.yourdomain.com",
        NODE_ENV: "production",
      })
    ).toBe("https://yourdomain.com,https://api.yourdomain.com")
  })
})

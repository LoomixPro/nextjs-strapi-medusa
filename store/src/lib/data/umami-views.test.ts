import {
  getUmamiViewCount,
  getUmamiViewMap,
  resetUmamiViewsCache,
} from "./umami-views"

describe("umami-views", () => {
  const env = process.env
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    process.env = { ...env }
    resetUmamiViewsCache()
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
    resetUmamiViewsCache()
  })

  afterAll(() => {
    process.env = env
  })

  it("returns empty map when Umami credentials are missing in production", async () => {
    process.env = {
      ...env,
      NODE_ENV: "production",
    }
    delete process.env.UMAMI_USERNAME
    delete process.env.UMAMI_PASSWORD

    await expect(getUmamiViewMap()).resolves.toEqual({})
  })

  it("parses product and blog paths from Umami metrics", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      UMAMI_URL: "http://umami:3000",
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "site-1",
    }

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "mock-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { x: "/us/products/sneakers", y: 10 },
          { x: "/fa/blog/post-abc", y: 5 },
        ],
      }) as typeof fetch

    await expect(getUmamiViewMap()).resolves.toEqual({
      sneakers: 10,
      "post-abc": 5,
    })
  })

  it("caches view map within TTL", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      UMAMI_URL: "http://umami:3000",
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "site-1",
    }

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "mock-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ x: "/products/a", y: 1 }],
      })

    global.fetch = fetchMock as typeof fetch

    await getUmamiViewMap()
    await getUmamiViewMap()

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("getUmamiViewCount returns count for a single handle", async () => {
    process.env = {
      ...env,
      NODE_ENV: "development",
      UMAMI_URL: "http://umami:3000",
      NEXT_PUBLIC_UMAMI_WEBSITE_ID: "site-1",
    }

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "mock-token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ x: "/products/hat", y: 7 }],
      }) as typeof fetch

    await expect(getUmamiViewCount("hat")).resolves.toBe(7)
    await expect(getUmamiViewCount("missing")).resolves.toBe(0)
  })
})

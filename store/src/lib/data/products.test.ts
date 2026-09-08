import {
  listProducts,
  listProductsWithSort,
  getProductReviews,
  addProductReview,
  toggleReviewReaction,
  getProductQuestions,
  submitQuestion,
} from "./products"
import { sdk } from "@lib/config"
import { getRegion } from "./regions"
import { revalidateTag } from "next/cache"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("./regions", () => ({
  getRegion: jest.fn(),
  retrieveRegion: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("@lib/util/get-locale-header", () => ({
  getLocaleHeader: jest.fn().mockResolvedValue({}),
}))

jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheOptions: jest.fn().mockResolvedValue({ tags: ["mock-tag"] }),
}))

jest.mock("./campaigns", () => ({
  getCampaignProducts: jest.fn(),
}))

import { getCampaignProducts } from "./campaigns"

describe("products data actions", () => {
  let originalFetch: any
  let consoleErrorSpy: jest.SpyInstance
  let consoleLogSpy: jest.SpyInstance

  beforeAll(() => {
    originalFetch = global.fetch
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ;(sdk.client.fetch as jest.Mock).mockReset()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })

  describe("listProducts", () => {
    it("should throw error if countryCode and regionId are missing", async () => {
      await expect(listProducts({})).rejects.toThrow(
        "Country code or region ID is required"
      )
    })

    it("should return empty products if region is not found", async () => {
      ;(getRegion as jest.Mock).mockResolvedValueOnce(null)

      const result = await listProducts({ countryCode: "us" })
      expect(result).toEqual({
        response: { products: [], count: 0 },
        nextPage: null,
      })
    })

    it("should fetch products correctly for region successfully", async () => {
      const mockRegion = { id: "reg_1" }
      const mockProductsResponse = { products: [{ id: "prod_1" }], count: 1 }

      ;(getRegion as jest.Mock).mockResolvedValueOnce(mockRegion)
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce(
        mockProductsResponse
      )

      const result = await listProducts({ countryCode: "us", pageParam: 1 })

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/products",
        expect.objectContaining({
          method: "GET",
          query: expect.objectContaining({
            limit: 12,
            offset: 0,
            region_id: "reg_1",
          }),
        })
      )
      expect(result.response.products).toEqual(mockProductsResponse.products)
      expect(result.nextPage).toBeNull()
    })
  })

  describe("listProductsWithSort", () => {
    it("should execute Meilisearch query and preserve sorting order of loaded products", async () => {
      const mockMeiliResponse = {
        hits: [{ id: "prod_2" }, { id: "prod_1" }],
        totalHits: 2,
        estimatedTotalHits: 2,
        facetDistribution: { color_facets: { Blue: 1 } },
      }

      // Mock global fetch for Meilisearch
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMeiliResponse),
      } as any)

      // Mock getRegion and listProducts inner call
      const mockRegion = { id: "reg_1" }
      ;(getRegion as jest.Mock).mockResolvedValueOnce(mockRegion)
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        products: [
          { id: "prod_1", title: "Product 1" },
          { id: "prod_2", title: "Product 2" },
        ],
        count: 2,
      })

      // We sort by price_asc
      process.env.NEXT_PUBLIC_MEILISEARCH_HOST = "http://localhost:7700"
      process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY = "meili-key"

      const result = await listProductsWithSort({
        page: 1,
        countryCode: "us",
        sortBy: "price_asc",
        queryParams: { limit: 12, only_available: "true" },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:7700/indexes/products/search",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("variants.inventory_quantity >= 1"),
        })
      )
      // Preserved Meilisearch sorting: order follows Meili hits array
      expect(result.response.products.map((product) => product.id)).toEqual([
        "prod_2",
        "prod_1",
      ])
      expect(result.response.count).toBe(2)
      expect(result.response.facets).toEqual(
        mockMeiliResponse.facetDistribution
      )
    })

    it("should prefer server-only Meilisearch env over NEXT_PUBLIC", async () => {
      const mockMeiliResponse = {
        hits: [{ id: "prod_1" }],
        totalHits: 1,
        estimatedTotalHits: 1,
        facetDistribution: {},
      }

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce(mockMeiliResponse),
      } as any)

      ;(getRegion as jest.Mock).mockResolvedValueOnce({ id: "reg_1" })
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        products: [{ id: "prod_1", title: "Product 1" }],
        count: 1,
      })

      process.env.MEILISEARCH_HOST = "http://meilisearch:7700"
      process.env.MEILISEARCH_API_KEY = "server-only-key"
      process.env.NEXT_PUBLIC_MEILISEARCH_HOST = "http://localhost:7700"
      process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY = "public-key"

      await listProductsWithSort({
        page: 1,
        countryCode: "us",
        sortBy: "created_at",
        queryParams: { limit: 12 },
      })

      expect(global.fetch).toHaveBeenCalledWith(
        "http://meilisearch:7700/indexes/products/search",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer server-only-key",
          }),
        })
      )
    })

    it("should handle Meilisearch environment variables missing", async () => {
      delete process.env.NEXT_PUBLIC_MEILISEARCH_HOST
      delete process.env.MEILISEARCH_HOST

      const result = await listProductsWithSort({ countryCode: "us" })
      expect(result.response.products).toEqual([])
    })

    it("should return empty product list on Meilisearch exception", async () => {
      process.env.NEXT_PUBLIC_MEILISEARCH_HOST = "http://localhost:7700"
      process.env.NEXT_PUBLIC_MEILISEARCH_SEARCH_KEY = "meili-key"

      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error("Meili Connection Refused"))

      const result = await listProductsWithSort({ countryCode: "us" })
      expect(result.response.products).toEqual([])
    })
  })

  describe("reviews and questions", () => {
    it("getProductReviews should fetch product reviews", async () => {
      const mockReviewsResponse = { reviews: [], average_rating: 4.5, count: 0 }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce(
        mockReviewsResponse
      )

      const result = await getProductReviews({
        productId: "prod_1",
        is_verified_buyer: true,
      })

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/products/prod_1/reviews",
        expect.objectContaining({
          query: expect.objectContaining({
            limit: 10,
            offset: 0,
            is_verified_buyer: true,
          }),
        })
      )
      expect(result).toEqual(mockReviewsResponse)
    })

    it("addProductReview should post product review successfully", async () => {
      const mockInput = {
        product_id: "prod_1",
        rating: 5,
        content: "Great",
        first_name: "John",
        last_name: "Doe",
      }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({ success: true })

      await addProductReview(mockInput)

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/reviews",
        expect.objectContaining({
          method: "POST",
          body: mockInput,
        })
      )
    })

    it("toggleReviewReaction should post reaction and revalidate cache", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({ like_count: 5 })

      const result = await toggleReviewReaction("rev_1", "prod_1", "like")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/reviews/rev_1/reactions",
        expect.objectContaining({
          method: "POST",
          body: { type: "like" },
        })
      )
      expect(revalidateTag).toHaveBeenCalledWith(
        "product-reviews-prod_1",
        "max"
      )
      expect(result).toEqual({ like_count: 5 })
    })

    it("getProductQuestions should fetch product questions", async () => {
      const mockQuestionsResponse = { questions: [], count: 0 }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce(
        mockQuestionsResponse
      )

      const result = await getProductQuestions({ productId: "prod_1" })

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/products/prod_1/questions",
        expect.objectContaining({
          query: { limit: 10, offset: 0, order: "-created_at" },
        })
      )
      expect(result).toEqual(mockQuestionsResponse)
    })

    it("submitQuestion should post question successfully", async () => {
      const mockInput = {
        name: "John",
        email: "john@test.com",
        question_text: "Does it fit?",
        product_id: "prod_1",
      }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({ success: true })

      await submitQuestion(mockInput)

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/questions",
        expect.objectContaining({
          method: "POST",
          body: mockInput,
        })
      )
    })
  })
})

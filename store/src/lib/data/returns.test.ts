import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import {
  listReturnReasons,
  listReturnShippingOptions,
  createReturnRequest,
} from "./returns"
import medusaError from "@lib/util/medusa-error"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/data/cookies", () => ({
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ authorization: "Bearer mock-token" }),
  getCacheOptions: jest
    .fn()
    .mockResolvedValue({ revalidate: 3600, tags: ["mock-tag"] }),
}))

jest.mock("@lib/util/medusa-error", () =>
  jest.fn((err) => {
    throw new Error(err.message || "Medusa Error")
  })
)

describe("Returns Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("listReturnReasons", () => {
    it("should fetch return reasons successfully", async () => {
      const mockResponse = {
        return_reasons: [{ id: "rr_1", value: "wrong_size" }],
      }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const result = await listReturnReasons()

      expect(getAuthHeaders).toHaveBeenCalled()
      expect(getCacheOptions).toHaveBeenCalledWith("return-reasons")
      expect(sdk.client.fetch).toHaveBeenCalledWith(`/store/return-reasons`, {
        method: "GET",
        headers: { authorization: "Bearer mock-token" },
        next: { revalidate: 3600, tags: ["mock-tag"] },
        cache: "force-cache",
      })
      expect(result).toEqual(mockResponse.return_reasons)
    })

    it("should return empty array when fetching return reasons fails", async () => {
      const error = new Error("Failed to fetch reasons")
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(error)

      const result = await listReturnReasons()
      expect(result).toEqual([])
    })
  })

  describe("listReturnShippingOptions", () => {
    it("should fetch return shipping options successfully", async () => {
      const mockResponse = {
        shipping_options: [{ id: "so_1", price_type: "flat_rate" }],
      }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const result = await listReturnShippingOptions("cart_123")

      expect(getAuthHeaders).toHaveBeenCalled()
      expect(getCacheOptions).toHaveBeenCalledWith("shipping-options")
      expect(sdk.client.fetch).toHaveBeenCalledWith(`/store/shipping-options`, {
        method: "GET",
        query: {
          cart_id: "cart_123",
          is_return: true,
        },
        headers: { authorization: "Bearer mock-token" },
        next: { revalidate: 3600, tags: ["mock-tag"] },
        cache: "force-cache",
      })
      expect(result).toEqual(mockResponse.shipping_options)
    })

    it("should handle error when fetching return shipping options fails", async () => {
      const error = new Error("Failed to fetch shipping options")
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(error)

      await expect(listReturnShippingOptions("cart_123")).rejects.toThrow(
        "Failed to fetch shipping options"
      )
      expect(medusaError).toHaveBeenCalledWith(error)
    })
  })

  describe("createReturnRequest", () => {
    it("should return success when return request is created", async () => {
      const mockReturnData = { id: "ret_1" }
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        return: mockReturnData,
      })

      const formData = new FormData()
      formData.append("order_id", "order_123")
      formData.append(
        "items",
        JSON.stringify([
          {
            id: "item_1",
            quantity: 1,
            return_reason_id: "rr_1",
            note: "Too big",
          },
        ])
      )
      formData.append("return_shipping_option_id", "so_1")
      formData.append("location_id", "loc_1")

      const result = await createReturnRequest(
        { success: false, error: null, return: null },
        formData
      )

      expect(getAuthHeaders).toHaveBeenCalled()
      expect(sdk.client.fetch).toHaveBeenCalledWith(`/store/returns`, {
        method: "POST",
        body: {
          order_id: "order_123",
          items: [
            { id: "item_1", quantity: 1, reason_id: "rr_1", note: "Too big" },
          ],
          return_shipping: {
            option_id: "so_1",
          },
          location_id: "loc_1",
        },
        headers: { authorization: "Bearer mock-token" },
      })
      expect(result).toEqual({
        success: true,
        error: null,
        return: mockReturnData,
      })
    })

    it("should return error if required fields are missing", async () => {
      const formData = new FormData()
      // Missing order_id, items, return_shipping_option_id

      const result = await createReturnRequest(
        { success: false, error: null, return: null },
        formData
      )

      expect(result).toEqual({
        success: false,
        error: "Order ID, items, and return shipping option are required",
        return: null,
      })
      expect(sdk.client.fetch).not.toHaveBeenCalled()
    })

    it("should return error when fetch fails", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network Error")
      )

      const formData = new FormData()
      formData.append("order_id", "order_123")
      formData.append("items", JSON.stringify([{ id: "item_1", quantity: 1 }]))
      formData.append("return_shipping_option_id", "so_1")
      formData.append("location_id", "loc_1")

      const result = await createReturnRequest(
        { success: false, error: null, return: null },
        formData
      )

      expect(result).toEqual({
        success: false,
        error: "Network Error",
        return: null,
      })
    })
  })
})

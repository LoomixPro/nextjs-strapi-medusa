import {
  listCartShippingMethods,
  calculatePriceForShippingOption,
} from "./fulfillment"
import { sdk } from "@lib/config"

jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheOptions: jest.fn().mockResolvedValue({}),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

describe("Fulfillment Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("listCartShippingMethods", () => {
    it("should fetch shipping options for cart successfully", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        shipping_options: [{ id: "so_1", name: "Standard" }],
      })

      const options = await listCartShippingMethods("cart_123")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/shipping-options",
        expect.objectContaining({
          query: { cart_id: "cart_123" },
          method: "GET",
        })
      )
      expect(options).toEqual([{ id: "so_1", name: "Standard" }])
    })

    it("should return null on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network Error")
      )

      const options = await listCartShippingMethods("cart_123")
      expect(options).toBeNull()
    })
  })

  describe("calculatePriceForShippingOption", () => {
    it("should calculate price successfully with optional data body", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        shipping_option: { id: "so_1", price: 100 },
      })

      const option = await calculatePriceForShippingOption("so_1", "cart_123", {
        extra: "info",
      })

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/shipping-options/so_1/calculate",
        expect.objectContaining({
          method: "POST",
          body: { cart_id: "cart_123", data: { extra: "info" } },
        })
      )
      expect(option).toEqual({ id: "so_1", price: 100 })
    })

    it("should return null on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Calculation Error")
      )

      const option = await calculatePriceForShippingOption("so_1", "cart_123")
      expect(option).toBeNull()
    })
  })
})

import { listCartPaymentMethods } from "./payment"
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

describe("Payment Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("listCartPaymentMethods should fetch and sort payment providers", async () => {
    ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
      payment_providers: [{ id: "stripe" }, { id: "paypal" }],
    })

    const methods = await listCartPaymentMethods("reg_1")

    expect(sdk.client.fetch).toHaveBeenCalledWith(
      "/store/payment-providers",
      expect.objectContaining({
        query: { region_id: "reg_1" },
        method: "GET",
      })
    )

    // Sorts by ID alphabetically: paypal then stripe
    expect(methods).toEqual([{ id: "paypal" }, { id: "stripe" }])
  })

  it("listCartPaymentMethods should return null on fetch failure", async () => {
    ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("API Error")
    )

    const methods = await listCartPaymentMethods("reg_1")
    expect(methods).toBeNull()
  })
})

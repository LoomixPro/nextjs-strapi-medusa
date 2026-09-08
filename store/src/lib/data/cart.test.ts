import { addToCart, updateLineItem, applyPromotions } from "./cart"
import { sdk } from "@lib/config"

// Mock Next.js app features
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  revalidatePath: jest.fn(),
}))
jest.mock("next/navigation", () => ({ redirect: jest.fn() }))

// Mock cookies utility
jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheOptions: jest.fn().mockResolvedValue({}),
  getCacheTag: jest.fn().mockResolvedValue("mock_tag"),
  getCartId: jest.fn().mockResolvedValue("cart_123"),
  setCartId: jest.fn(),
  removeCartId: jest.fn(),
}))

// Mock region and locale utilities
jest.mock("./regions", () => ({
  getRegion: jest.fn().mockResolvedValue({ id: "reg_1", currency_code: "usd" }),
}))

jest.mock("@lib/data/locale-actions", () => ({
  getLocale: jest.fn().mockResolvedValue("en-US"),
}))

// Mock Medusa SDK
jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
    store: {
      cart: {
        create: jest.fn().mockResolvedValue({ cart: { id: "cart_new" } }),
        update: jest.fn().mockResolvedValue({ cart: { id: "cart_123" } }),
        createLineItem: jest
          .fn()
          .mockResolvedValue({ cart: { id: "cart_123" } }),
        updateLineItem: jest
          .fn()
          .mockResolvedValue({ cart: { id: "cart_123" } }),
      },
    },
  },
}))

describe("Cart Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("addToCart should call sdk.store.cart.createLineItem and revalidate caches", async () => {
    // getOrSetCart is called internally, which retrieves cart_123
    ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
      cart: { id: "cart_123", region_id: "reg_1", currency_code: "usd" },
    })

    const result = await addToCart({
      variantId: "var_1",
      quantity: 2,
      countryCode: "us",
    })

    // addToCart catches errors and returns message, if successful it returns undefined
    expect(result).toBeUndefined()
    expect(sdk.store.cart.createLineItem).toHaveBeenCalledWith(
      "cart_123",
      { variant_id: "var_1", quantity: 2 },
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("updateLineItem should call sdk.store.cart.updateLineItem", async () => {
    await updateLineItem({ lineId: "line_1", quantity: 3 })

    expect(sdk.store.cart.updateLineItem).toHaveBeenCalledWith(
      "cart_123",
      "line_1",
      { quantity: 3 },
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("applyPromotions should call sdk.store.cart.update with promo_codes", async () => {
    await applyPromotions(["SUMMER20"])

    expect(sdk.store.cart.update).toHaveBeenCalledWith(
      "cart_123",
      { promo_codes: ["SUMMER20"] },
      {},
      { authorization: "Bearer mock" }
    )
  })

  // --- New Tests ---

  it("deleteLineItem should call deleteLineItem API", async () => {
    sdk.store.cart.deleteLineItem = jest.fn().mockResolvedValue({})
    await import("./cart").then((m) => m.deleteLineItem("line_1"))

    expect(sdk.store.cart.deleteLineItem).toHaveBeenCalledWith(
      "cart_123",
      "line_1",
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("setShippingMethod should call addShippingMethod API", async () => {
    sdk.store.cart.addShippingMethod = jest.fn().mockResolvedValue({})
    await import("./cart").then((m) =>
      m.setShippingMethod({ cartId: "cart_123", shippingMethodId: "sm_1" })
    )

    expect(sdk.store.cart.addShippingMethod).toHaveBeenCalledWith(
      "cart_123",
      { option_id: "sm_1" },
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("initiatePaymentSession should call initiatePaymentSession API", async () => {
    sdk.store.payment = {
      initiatePaymentSession: jest.fn().mockResolvedValue({ session: {} }),
    } as any
    await import("./cart").then((m) =>
      m.initiatePaymentSession({ id: "cart_1" } as any, {
        provider_id: "stripe",
      })
    )

    expect(sdk.store.payment.initiatePaymentSession).toHaveBeenCalledWith(
      { id: "cart_1" },
      { provider_id: "stripe" },
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("setAddresses should map FormData and update cart", async () => {
    const formData = new FormData()
    formData.append("shipping_address.first_name", "Ali")
    formData.append("email", "ali@test.com")
    formData.append("same_as_billing", "on")

    const { setAddresses } = await import("./cart")
    await setAddresses({}, formData)

    expect(sdk.store.cart.update).toHaveBeenCalledWith(
      "cart_123",
      expect.objectContaining({
        email: "ali@test.com",
        shipping_address: expect.objectContaining({ first_name: "Ali" }),
        billing_address: expect.objectContaining({ first_name: "Ali" }), // because sameAsBilling=on
      }),
      {},
      { authorization: "Bearer mock" }
    )
  })

  it("placeOrder should complete cart and redirect", async () => {
    sdk.store.cart.complete = jest.fn().mockResolvedValue({
      type: "order",
      order: { id: "ord_1", shipping_address: { country_code: "US" } },
    })

    const { placeOrder } = await import("./cart")
    const { removeCartId } = await import("./cookies")
    const { redirect } = await import("next/navigation")
    const { revalidateTag, revalidatePath } = await import("next/cache")

    await placeOrder("cart_123")

    expect(sdk.store.cart.complete).toHaveBeenCalledWith(
      "cart_123",
      {},
      { authorization: "Bearer mock" }
    )
    expect(removeCartId).toHaveBeenCalled()
    expect(revalidateTag).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith("/", "layout")
    expect(redirect).toHaveBeenCalledWith("/us/order/ord_1/confirmed")
  })

  it("retrieveCart should return null when cart is already completed", async () => {
    ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
      cart: { id: "cart_123", completed_at: "2026-01-01T00:00:00.000Z" },
    })

    const { retrieveCart } = await import("./cart")
    const { removeCartId } = await import("./cookies")

    const cart = await retrieveCart("cart_123")

    expect(cart).toBeNull()
    expect(removeCartId).not.toHaveBeenCalled()
  })

  it("addToCart should return error message on exception during line item creation", async () => {
    ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
      cart: { id: "cart_123", region_id: "reg_1", currency_code: "usd" },
    })
    ;(sdk.store.cart.createLineItem as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to add variant")
    )

    const result = await addToCart({
      variantId: "var_1",
      quantity: 2,
      countryCode: "us",
    })
    expect(result).toBe("Error setting up the request: Failed to add variant")
  })

  it("placeOrder should propagate complete exception", async () => {
    sdk.store.cart.complete = jest
      .fn()
      .mockRejectedValueOnce(new Error("Failed to place order"))
    const { placeOrder } = await import("./cart")

    await expect(placeOrder("cart_123")).rejects.toThrow(
      "Error setting up the request: Failed to place order"
    )
  })
})

import { addCustomerAddress } from "./customer"
import { sdk } from "@lib/config"

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }))
jest.mock("next/navigation", () => ({ redirect: jest.fn() }))

jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheTag: jest.fn().mockResolvedValue("mock_tag"),
  setAuthToken: jest.fn(),
  removeAuthToken: jest.fn(),
  getCartId: jest.fn().mockResolvedValue("cart_123"),
  setCartId: jest.fn(),
  removeCartId: jest.fn(),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    store: {
      customer: {
        createAddress: jest
          .fn()
          .mockResolvedValue({ customer: { id: "cus_1" } }),
      },
    },
  },
}))

describe("Customer Data Actions", () => {
  it("addCustomerAddress should call sdk.store.customer.createAddress", async () => {
    const formData = new FormData()
    formData.append("first_name", "John")
    formData.append("last_name", "Doe")
    formData.append("country_code", "us")

    const result = await addCustomerAddress({}, formData)

    expect(sdk.store.customer.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: "John",
        last_name: "Doe",
        country_code: "us",
      }),
      {},
      { authorization: "Bearer mock" }
    )

    expect(result).toEqual({ success: true, error: null })
  })

  it("updateCustomerAddress should call updateAddress", async () => {
    const formData = new FormData()
    formData.append("first_name", "Ali")

    sdk.store.customer.updateAddress = jest.fn().mockResolvedValue({})
    const { updateCustomerAddress } = await import("./customer")
    const result = await updateCustomerAddress(
      { addressId: "addr_1" },
      formData
    )

    expect(sdk.store.customer.updateAddress).toHaveBeenCalledWith(
      "addr_1",
      expect.any(Object),
      {},
      expect.any(Object)
    )
    expect(result.success).toBe(true)
  })

  it("deleteCustomerAddress should call deleteAddress", async () => {
    sdk.store.customer.deleteAddress = jest.fn().mockResolvedValue({})
    const { deleteCustomerAddress } = await import("./customer")
    await deleteCustomerAddress("addr_1")

    expect(sdk.store.customer.deleteAddress).toHaveBeenCalledWith(
      "addr_1",
      expect.any(Object)
    )
  })

  it("signout should logout, remove tokens, and redirect", async () => {
    sdk.auth = { logout: jest.fn().mockResolvedValue({}) } as any
    const { removeAuthToken, removeCartId } = await import("./cookies")
    const { redirect } = await import("next/navigation")
    const { signout } = await import("./customer")

    await signout("ir")

    expect(sdk.auth.logout).toHaveBeenCalled()
    expect(removeAuthToken).toHaveBeenCalled()
    expect(removeCartId).toHaveBeenCalled()
    expect(redirect).toHaveBeenCalledWith("/ir/account")
  })
})

import { getLocale, setLocaleCookie, updateLocale } from "./locale-actions"
import { readCookie, requireCookieStore } from "@lib/util/safe-cookies"
import { getCartId, getAuthHeaders, getCacheTag, removeCartId } from "./cookies"
import { revalidateTag } from "next/cache"
import { sdk } from "@lib/config"

jest.mock("@lib/util/safe-cookies", () => ({
  readCookie: jest.fn(),
  requireCookieStore: jest.fn(),
}))

jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
}))

jest.mock("./cookies", () => ({
  getCartId: jest.fn(),
  getAuthHeaders: jest.fn(),
  getCacheTag: jest.fn(),
  removeCartId: jest.fn(),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    store: {
      cart: {
        update: jest.fn(),
      },
    },
  },
}))

describe("locale-actions", () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe("getLocale", () => {
    it("should return the locale cookie value", async () => {
      ;(readCookie as jest.Mock).mockResolvedValueOnce("fa")

      const result = await getLocale()
      expect(result).toBe("fa")
      expect(readCookie).toHaveBeenCalledWith("_medusa_locale")
    })

    it("should return null if cookie is missing", async () => {
      ;(readCookie as jest.Mock).mockResolvedValueOnce(undefined)

      const result = await getLocale()
      expect(result).toBeNull()
    })

    it("should reject when cookie read fails", async () => {
      ;(readCookie as jest.Mock).mockRejectedValueOnce(
        new Error("Cookies error")
      )
      await expect(getLocale()).rejects.toThrow("Cookies error")
    })
  })

  describe("setLocaleCookie", () => {
    it("should set cookie with correct options", async () => {
      const mockSet = jest.fn()
      ;(requireCookieStore as jest.Mock).mockResolvedValueOnce({ set: mockSet })

      await setLocaleCookie("fa")

      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_locale",
        "fa",
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 365,
          httpOnly: false,
          sameSite: "strict",
        })
      )
    })
  })

  describe("updateLocale", () => {
    it("should update locale, revalidate page caches and return locale code when no cart exists", async () => {
      const mockSet = jest.fn()
      ;(requireCookieStore as jest.Mock).mockResolvedValueOnce({ set: mockSet })
      ;(getCartId as jest.Mock).mockResolvedValueOnce(undefined)
      ;(getCacheTag as jest.Mock)
        .mockResolvedValueOnce("products-tag")
        .mockResolvedValueOnce("categories-tag")
        .mockResolvedValueOnce("collections-tag")

      const result = await updateLocale("fa")

      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_locale",
        "fa",
        expect.any(Object)
      )
      expect(getCartId).toHaveBeenCalled()
      expect(sdk.store.cart.update).not.toHaveBeenCalled()
      expect(revalidateTag).toHaveBeenCalledWith("products-tag", "max")
      expect(revalidateTag).toHaveBeenCalledWith("categories-tag", "max")
      expect(revalidateTag).toHaveBeenCalledWith("collections-tag", "max")
      expect(result).toBe("fa")
    })

    it("should update cart locale and revalidate cart cache when cart exists", async () => {
      const mockSet = jest.fn()
      ;(requireCookieStore as jest.Mock).mockResolvedValueOnce({ set: mockSet })
      ;(getCartId as jest.Mock).mockResolvedValueOnce("cart_123")
      ;(getAuthHeaders as jest.Mock).mockResolvedValueOnce({
        authorization: "Bearer mock",
      })
      ;(sdk.store.cart.update as jest.Mock).mockResolvedValueOnce({})
      ;(getCacheTag as jest.Mock)
        .mockResolvedValueOnce("cart-tag")
        .mockResolvedValueOnce("products-tag")
        .mockResolvedValueOnce("categories-tag")
        .mockResolvedValueOnce("collections-tag")

      await updateLocale("fa")

      expect(sdk.store.cart.update).toHaveBeenCalledWith(
        "cart_123",
        { locale: "fa" },
        {},
        { authorization: "Bearer mock" }
      )
      expect(revalidateTag).toHaveBeenCalledWith("cart-tag", "max")
    })

    it("should delete cart ID from cookies if cart update fails because of invalid/deleted variants", async () => {
      const mockSet = jest.fn()
      ;(requireCookieStore as jest.Mock).mockResolvedValueOnce({ set: mockSet })
      ;(getCartId as jest.Mock).mockResolvedValueOnce("cart_123")
      ;(getAuthHeaders as jest.Mock).mockResolvedValueOnce({
        authorization: "Bearer mock",
      })
      ;(sdk.store.cart.update as jest.Mock).mockRejectedValueOnce(
        new Error("Variant does not exist")
      )
      ;(getCacheTag as jest.Mock)
        .mockResolvedValueOnce("products-tag")
        .mockResolvedValueOnce("categories-tag")
        .mockResolvedValueOnce("collections-tag")

      await updateLocale("fa")

      expect(removeCartId).toHaveBeenCalled()
    })
  })
})

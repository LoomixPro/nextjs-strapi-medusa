/**
 * @jest-environment node
 */
import {
  getAuthHeaders,
  getCacheTag,
  getCacheOptions,
  setAuthToken,
  removeAuthToken,
  getCartId,
  setCartId,
  removeCartId,
} from "./cookies"
import { cookies as nextCookies } from "next/headers"

jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}))

describe("cookies utility", () => {
  beforeEach(() => {
    ;(nextCookies as jest.Mock).mockReset()
  })

  describe("getAuthHeaders", () => {
    it("should return empty object if token cookie is missing", async () => {
      const mockGet = jest.fn().mockReturnValueOnce(undefined)
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const headers = await getAuthHeaders()
      expect(headers).toEqual({})
      expect(mockGet).toHaveBeenCalledWith("_medusa_jwt")
    })

    it("should return bearer authorization header if token is present", async () => {
      const mockGet = jest.fn().mockReturnValueOnce({ value: "test-jwt-token" })
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const headers = await getAuthHeaders()
      expect(headers).toEqual({ authorization: "Bearer test-jwt-token" })
    })

    it("should return empty object if cookies are unavailable during prerender", async () => {
      ;(nextCookies as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error("During prerendering, `cookies()` rejects"), {
          digest: "HANGING_PROMISE_REJECTION",
        })
      )

      const headers = await getAuthHeaders()
      expect(headers).toEqual({})
    })
  })

  describe("getCacheTag", () => {
    it("should return tag with cache id if cookie is present", async () => {
      const mockGet = jest.fn().mockReturnValueOnce({ value: "session-123" })
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const tag = await getCacheTag("cart")
      expect(tag).toBe("cart-session-123")
      expect(mockGet).toHaveBeenCalledWith("_medusa_cache_id")
    })

    it("should return empty string if cache id is missing", async () => {
      const mockGet = jest.fn().mockReturnValueOnce(undefined)
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const tag = await getCacheTag("cart")
      expect(tag).toBe("")
    })

    it("should return empty string if cookies are unavailable during prerender", async () => {
      ;(nextCookies as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error("During prerendering, `cookies()` rejects"), {
          digest: "HANGING_PROMISE_REJECTION",
        })
      )

      const tag = await getCacheTag("cart")
      expect(tag).toBe("")
    })
  })

  describe("getCacheOptions", () => {
    it("should return empty object when window is defined (client-side)", async () => {
      try {
        ;(global as any).window = {}
        const options = await getCacheOptions("cart")
        expect(options).toEqual({})
      } finally {
        delete (global as any).window
      }
    })

    it("should return tag list when cache tag exists", async () => {
      const mockGet = jest.fn().mockReturnValueOnce({ value: "session-123" })
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const options = await getCacheOptions("cart")
      expect(options).toEqual({ tags: ["cart", "cart-session-123"] })
    })

    it("should return default tag list when cache tag does not exist", async () => {
      const mockGet = jest.fn().mockReturnValueOnce(undefined)
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const options = await getCacheOptions("cart")
      expect(options).toEqual({ tags: ["cart"] })
    })
  })

  describe("setAuthToken", () => {
    it("should set _medusa_jwt cookie with correct options", async () => {
      const mockSet = jest.fn()
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ set: mockSet })

      await setAuthToken("new-token")
      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_jwt",
        "new-token",
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          sameSite: "strict",
        })
      )
    })
  })

  describe("removeAuthToken", () => {
    it("should expire _medusa_jwt cookie", async () => {
      const mockSet = jest.fn()
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ set: mockSet })

      await removeAuthToken()
      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_jwt",
        "",
        expect.objectContaining({ maxAge: -1 })
      )
    })
  })

  describe("getCartId", () => {
    it("should return cart ID if present", async () => {
      const mockGet = jest.fn().mockReturnValueOnce({ value: "cart_abc" })
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ get: mockGet })

      const cartId = await getCartId()
      expect(cartId).toBe("cart_abc")
      expect(mockGet).toHaveBeenCalledWith("_medusa_cart_id")
    })
  })

  describe("setCartId", () => {
    it("should set _medusa_cart_id cookie with correct options", async () => {
      const mockSet = jest.fn()
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ set: mockSet })

      await setCartId("cart_abc")
      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_cart_id",
        "cart_abc",
        expect.objectContaining({
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          sameSite: "strict",
        })
      )
    })
  })

  describe("removeCartId", () => {
    it("should expire _medusa_cart_id cookie", async () => {
      const mockSet = jest.fn()
      ;(nextCookies as jest.Mock).mockResolvedValueOnce({ set: mockSet })

      await removeCartId()
      expect(mockSet).toHaveBeenCalledWith(
        "_medusa_cart_id",
        "",
        expect.objectContaining({ maxAge: -1 })
      )
    })
  })
})

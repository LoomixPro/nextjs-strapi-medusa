import { addToWishlist, removeFromWishlist, getWishlist } from "./wishlist"
import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"
import { revalidateTag } from "next/cache"

jest.mock("next-intl/server", () => ({
  getTranslations: jest.fn().mockResolvedValue((key: string) => key),
}))

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }))

jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheOptions: jest.fn().mockResolvedValue({}),
  getCacheTag: jest.fn().mockResolvedValue("mock_tag"),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

describe("Wishlist Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("getWishlist", () => {
    it("should return null if not authenticated", async () => {
      ;(getAuthHeaders as jest.Mock).mockResolvedValueOnce({})
      const result = await getWishlist()
      expect(result).toBeNull()
      expect(sdk.client.fetch).not.toHaveBeenCalled()
    })

    it("should fetch and return wishlist if authenticated", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        wishlist: { id: "wish_1", items: [] },
      })
      const result = await getWishlist()

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/customers/me/wishlists",
        expect.objectContaining({ method: "GET" })
      )
      expect(result).toEqual({ id: "wish_1", items: [] })
    })

    it("should return null on fetch error", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("API Error")
      )
      const result = await getWishlist()
      expect(result).toBeNull()
    })
  })

  describe("addToWishlist", () => {
    it("should return error message if not authenticated", async () => {
      ;(getAuthHeaders as jest.Mock).mockResolvedValueOnce({})
      const result = await addToWishlist("var_1")
      expect(result).toBe("login_required")
      expect(sdk.client.fetch).not.toHaveBeenCalled()
    })

    it("should create wishlist if it doesn't exist, then add item and revalidate", async () => {
      // First fetch (getWishlist) returns null
      ;(sdk.client.fetch as jest.Mock)
        .mockResolvedValueOnce(null) // getWishlist fails
        .mockResolvedValueOnce({ wishlist: { id: "wish_new" } }) // Create wishlist
        .mockResolvedValueOnce({ item: { id: "item_1" } }) // Add item

      const result = await addToWishlist("var_1")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/customers/me/wishlists",
        expect.objectContaining({ method: "POST" })
      )
      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/customers/me/wishlists/items",
        expect.objectContaining({
          method: "POST",
          body: { variant_id: "var_1" },
        })
      )
      expect(revalidateTag).toHaveBeenCalledWith("mock_tag", "max")
      expect(result).toBeUndefined()
    })

    it("should skip creating wishlist if it already exists, add item and revalidate", async () => {
      // First fetch (getWishlist) returns existing wishlist
      ;(sdk.client.fetch as jest.Mock)
        .mockResolvedValueOnce({ wishlist: { id: "wish_1" } }) // getWishlist succeeds
        .mockResolvedValueOnce({ item: { id: "item_1" } }) // Add item

      const result = await addToWishlist("var_1")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/customers/me/wishlists/items",
        expect.objectContaining({
          method: "POST",
          body: { variant_id: "var_1" },
        })
      )
      expect(revalidateTag).toHaveBeenCalledWith("mock_tag", "max")
      expect(result).toBeUndefined()
    })

    it("should return error message on exception during add item", async () => {
      // getWishlist succeeds, but adding item fails
      ;(sdk.client.fetch as jest.Mock)
        .mockResolvedValueOnce({ wishlist: { id: "wish_1" } })
        .mockRejectedValueOnce(new Error("API Error adding"))

      const result = await addToWishlist("var_1")
      expect(result).toBe("API Error adding")
    })
  })

  describe("removeFromWishlist", () => {
    it("should return error message if not authenticated", async () => {
      ;(getAuthHeaders as jest.Mock).mockResolvedValueOnce({})
      const result = await removeFromWishlist("item_1")
      expect(result).toBe("login_required_remove")
      expect(sdk.client.fetch).not.toHaveBeenCalled()
    })

    it("should call delete API and revalidate tag", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({})

      const result = await removeFromWishlist("item_1")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/customers/me/wishlists/items/item_1",
        expect.objectContaining({ method: "DELETE" })
      )
      expect(revalidateTag).toHaveBeenCalledWith("mock_tag", "max")
      expect(result).toBeUndefined()
    })

    it("should return error message on exception during delete item", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("API Error deleting")
      )

      const result = await removeFromWishlist("item_1")
      expect(result).toBe("API Error deleting")
    })
  })
})

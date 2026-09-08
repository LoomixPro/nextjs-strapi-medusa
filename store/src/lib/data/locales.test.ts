import { listLocales } from "./locales"
import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("./cookies", () => ({
  getCacheOptions: jest.fn().mockResolvedValue({ tags: ["mock-locales"] }),
}))

describe("locales data", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch and return locales list successfully", async () => {
    const mockLocales = [
      { code: "fa", name: "Persian" },
      { code: "en", name: "English" },
    ]
    ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
      locales: mockLocales,
    })

    const result = await listLocales()

    expect(getCacheOptions).toHaveBeenCalledWith("locales")
    expect(sdk.client.fetch).toHaveBeenCalledWith(
      "/store/locales",
      expect.objectContaining({
        method: "GET",
        next: { tags: ["mock-locales"], revalidate: 3600 },
        cache: "force-cache",
      })
    )
    expect(result).toEqual(mockLocales)
  })

  it("should return null on fetch failure", async () => {
    ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("API Error")
    )

    const result = await listLocales()
    expect(result).toBeNull()
  })
})

const mockCacheOptions = { tags: ["regions-tag"] }
jest.mock("./cookies", () => ({
  getCacheOptions: jest.fn().mockResolvedValue(mockCacheOptions),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
  },
}))

jest.mock("@lib/util/medusa-error", () =>
  jest.fn((err) => {
    throw new Error(err.message || "Medusa Error")
  })
)

describe("regions data actions", () => {
  let listRegions: any
  let retrieveRegion: any
  let getRegion: any
  let sdkInstance: any
  let medusaErrorMock: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    const configModule = require("@lib/config")
    sdkInstance = configModule.sdk

    medusaErrorMock = require("@lib/util/medusa-error")

    const regionsModule = require("./regions")
    listRegions = regionsModule.listRegions
    retrieveRegion = regionsModule.retrieveRegion
    getRegion = regionsModule.getRegion
  })

  describe("listRegions", () => {
    it("should fetch and return regions successfully", async () => {
      const mockRegions = [{ id: "reg_1", name: "US" }]
      ;(sdkInstance.client.fetch as jest.Mock).mockResolvedValueOnce({
        regions: mockRegions,
      })

      const result = await listRegions()

      expect(sdkInstance.client.fetch).toHaveBeenCalledWith(
        "/store/regions",
        expect.objectContaining({
          method: "GET",
          next: expect.objectContaining({
            tags: ["regions-tag"],
            revalidate: 3600,
          }),
          cache: "force-cache",
        })
      )
      expect(result).toEqual(mockRegions)
    })

    it("should call medusaError on fetch failure", async () => {
      const error = new Error("Network Error")
      ;(sdkInstance.client.fetch as jest.Mock).mockRejectedValueOnce(error)

      await expect(listRegions()).rejects.toThrow("Network Error")
      expect(medusaErrorMock).toHaveBeenCalledWith(error)
    })
  })

  describe("retrieveRegion", () => {
    it("should fetch and return specific region successfully", async () => {
      const mockRegion = { id: "reg_1", name: "US" }
      ;(sdkInstance.client.fetch as jest.Mock).mockResolvedValueOnce({
        region: mockRegion,
      })

      const result = await retrieveRegion("reg_1")

      expect(sdkInstance.client.fetch).toHaveBeenCalledWith(
        "/store/regions/reg_1",
        expect.objectContaining({
          method: "GET",
          cache: "force-cache",
        })
      )
      expect(result).toEqual(mockRegion)
    })

    it("should call medusaError on retrieve failure", async () => {
      const error = new Error("Not Found")
      ;(sdkInstance.client.fetch as jest.Mock).mockRejectedValueOnce(error)

      await expect(retrieveRegion("reg_1")).rejects.toThrow("Not Found")
      expect(medusaErrorMock).toHaveBeenCalledWith(error)
    })
  })

  describe("getRegion", () => {
    it("should list regions, populate regional cache, and return correct region for country code", async () => {
      const mockRegions = [
        { id: "reg_us", name: "US Region", countries: [{ iso_2: "us" }] },
        {
          id: "reg_eu",
          name: "EU Region",
          countries: [{ iso_2: "fr" }, { iso_2: "de" }],
        },
      ]
      ;(sdkInstance.client.fetch as jest.Mock).mockResolvedValue({
        regions: mockRegions,
      })

      // First call: calls listRegions and populates cache
      const resultFr = await getRegion("fr")
      expect(resultFr).toEqual(mockRegions[1])
      expect(sdkInstance.client.fetch).toHaveBeenCalledTimes(1)

      // Second call: loads from cache directly without fetching again
      const resultDe = await getRegion("de")
      expect(resultDe).toEqual(mockRegions[1])
      expect(sdkInstance.client.fetch).toHaveBeenCalledTimes(1)

      // Default fallback call when country code is falsy: default to 'us' mapping
      // It calls listRegions again because "" is not mapped in regionMap.
      const resultFallback = await getRegion("")
      expect(resultFallback).toEqual(mockRegions[0])
    })

    it("should return null when listing regions fails", async () => {
      ;(sdkInstance.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("API Error")
      )

      const result = await getRegion("us")
      expect(result).toBeNull()
    })
  })
})

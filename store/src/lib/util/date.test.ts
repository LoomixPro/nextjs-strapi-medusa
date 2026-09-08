import { toJalali, toJalaliDateTime } from "./date"

// Mock storefront-settings to control isIranFeaturesEnabled.
// We use a getter connected to a global variable to avoid Jest hoisting ReferenceErrors.
jest.mock("./storefront-settings", () => ({
  get isIranFeaturesEnabled() {
    return (global as any).__mockIsIranFeaturesEnabled !== false
  },
}))

describe("date utilities", () => {
  beforeEach(() => {
    ;(global as any).__mockIsIranFeaturesEnabled = true
  })

  describe("toJalali (Iran features enabled)", () => {
    it("should convert a valid ISO date string to Jalali format exactly in UTC", () => {
      // 2024-03-20 = 1403/1/1 (first day of Farvardin)
      const result = toJalali("2024-03-20T12:00:00Z", { timeZone: "UTC" })
      expect(result).toBe("۱۴۰۳/۱/۱")
    })

    it("should convert a Date object to Jalali format exactly in UTC", () => {
      const date = new Date("2024-03-20T12:00:00Z")
      const result = toJalali(date, { timeZone: "UTC" })
      expect(result).toBe("۱۴۰۳/۱/۱")
    })

    it("should return empty string for null", () => {
      expect(toJalali(null)).toBe("")
    })

    it("should return empty string for undefined", () => {
      expect(toJalali(undefined)).toBe("")
    })

    it("should return empty string for empty string", () => {
      expect(toJalali("")).toBe("")
    })

    it("should return empty string for invalid date string", () => {
      expect(toJalali("not-a-date")).toBe("")
    })

    it("should accept custom Intl.DateTimeFormat options (long month name)", () => {
      const result = toJalali("2024-03-20T12:00:00Z", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      // Should be "۱ فروردین ۱۴۰۳"
      expect(result).toBe("۱ فروردین ۱۴۰۳")
    })
  })

  describe("toJalali (Iran features disabled)", () => {
    beforeEach(() => {
      ;(global as any).__mockIsIranFeaturesEnabled = false
    })

    it("should convert a valid ISO date string to Gregorian format in UTC", () => {
      const result = toJalali("2024-03-20T12:00:00Z", { timeZone: "UTC" })
      expect(result).toBe("3/20/2024")
    })

    it("should accept custom Intl.DateTimeFormat options (long month name)", () => {
      const result = toJalali("2024-03-20T12:00:00Z", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
      expect(result).toBe("March 20, 2024")
    })
  })

  describe("toJalaliDateTime", () => {
    it("should include time in the formatted output (Jalali)", () => {
      const result = toJalaliDateTime("2024-03-20T14:30:00Z")
      expect(result).toBeTruthy()
      expect(result).toMatch(/[۰-۹]/)
      expect(result).toContain(":")
    })

    it("should format as standard Gregorian when Iran features are disabled", () => {
      ;(global as any).__mockIsIranFeaturesEnabled = false
      const result = toJalaliDateTime("2024-03-20T14:30:00Z")
      expect(result).toBeTruthy()
      expect(result).not.toMatch(/[۰-۹]/)
      expect(result).toContain(":")
      expect(result).toContain("2024")
    })

    it("should return empty string for null", () => {
      expect(toJalaliDateTime(null)).toBe("")
    })

    it("should return empty string for undefined", () => {
      expect(toJalaliDateTime(undefined)).toBe("")
    })

    it("should return empty string for empty string", () => {
      expect(toJalaliDateTime("")).toBe("")
    })

    it("should return empty string for invalid date", () => {
      expect(toJalaliDateTime("invalid")).toBe("")
    })
  })
})

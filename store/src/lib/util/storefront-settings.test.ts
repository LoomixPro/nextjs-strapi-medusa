/**
 * @jest-environment node
 */
import {
  convertToLocale,
  setClientSettings,
  setServerRequestStore,
} from "./storefront-settings"

// Mock React.cache because in test environments (outside RSC requests) it is a no-op,
// which prevents the request-scoped store from sharing state between functions.
jest.mock("react", () => {
  process.env.NEXT_PUBLIC_ENABLE_IRAN_FEATURES = "true"
  const original = jest.requireActual("react")
  return {
    ...original,
    cache: (fn: any) => {
      let cachedValue: any = null
      return (...args: any[]) => {
        if (!cachedValue) {
          cachedValue = fn(...args)
        }
        return cachedValue
      }
    },
  }
})

describe("money utilities", () => {
  describe("convertToLocale", () => {
    it("should format standard currencies correctly", () => {
      const result = convertToLocale({
        amount: 1500,
        currency_code: "usd",
        locale: "en-US",
      })
      // It should format as $1,500.00
      expect(result).toContain("1,500")
    })

    it("should convert IRR (Rial) to Toman when settings enable it and locale is Persian", () => {
      const result = convertToLocale({
        amount: 500000,
        currency_code: "irr",
        locale: "fa",
        settings: { convertToToman: true },
      })
      // 500,000 Rial should become 50,000 Toman.
      // Persian NumberFormat uses Persian digits (۵۰٬۰۰۰).
      expect(result).toContain("تومان")
      expect(result).toContain("۵۰٬۰۰۰")
    })

    it("should keep IRR as Rial when Toman conversion is disabled", () => {
      const result = convertToLocale({
        amount: 500000,
        currency_code: "irr",
        locale: "fa",
        settings: { convertToToman: false },
      })
      // Should not contain the word Toman
      expect(result).not.toContain("تومان")
    })

    it("should just return the amount as a string if no currency code is provided", () => {
      const result = convertToLocale({
        amount: 250,
        currency_code: "",
      })
      expect(result).toBe("250")
    })

    it("should fallback to server request store settings when settings param is not provided", () => {
      // Since @jest-environment is node, window is undefined by default
      setServerRequestStore("fa", { convertToToman: true })

      const result = convertToLocale({
        amount: 500000,
        currency_code: "irr",
        locale: "fa",
      })

      expect(result).toContain("تومان")
      expect(result).toContain("۵۰٬۰۰۰")
    })

    it("should fallback to client global settings when window is defined and settings param is not provided", () => {
      // Temporarily define window to simulate client environment in node
      try {
        ;(global as any).window = {}
        setClientSettings({ convertToToman: true })

        const result = convertToLocale({
          amount: 500000,
          currency_code: "irr",
          locale: "fa",
        })

        expect(result).toContain("تومان")
        expect(result).toContain("۵۰٬۰۰۰")
      } finally {
        delete (global as any).window
      }
    })

    it("should be case-insensitive for currency codes", () => {
      const resultLower = convertToLocale({
        amount: 500000,
        currency_code: "irr",
        locale: "fa",
        settings: { convertToToman: true },
      })
      const resultUpper = convertToLocale({
        amount: 500000,
        currency_code: "IRR",
        locale: "fa",
        settings: { convertToToman: true },
      })
      const resultMixed = convertToLocale({
        amount: 500000,
        currency_code: "Irr",
        locale: "fa",
        settings: { convertToToman: true },
      })

      expect(resultLower).toBe(resultUpper)
      expect(resultUpper).toBe(resultMixed)
    })

    it("should format standard currency formatting options (minimum/maximum fraction digits)", () => {
      const result = convertToLocale({
        amount: 1234.567,
        currency_code: "USD",
        locale: "en-US",
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      })
      // USD formatted with max 2 digits is $1,234.57 (rounds up)
      expect(result).toContain("1,234.57")
    })
  })
})

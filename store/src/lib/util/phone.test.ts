import { formatPhoneOrEmail } from "./phone"

describe("phone utilities", () => {
  describe("formatPhoneOrEmail", () => {
    it("should return email when email is provided", () => {
      expect(formatPhoneOrEmail("user@example.com", null)).toBe(
        "user@example.com"
      )
    })

    it("should return email when both email and phone are provided (email takes priority)", () => {
      expect(formatPhoneOrEmail("user@example.com", "+989123456789")).toBe(
        "user@example.com"
      )
    })

    it("should return phone when only phone is provided", () => {
      expect(formatPhoneOrEmail(null, "+989123456789")).toBe("+989123456789")
    })

    it("should return phone when email is undefined", () => {
      expect(formatPhoneOrEmail(undefined, "09123456789")).toBe("09123456789")
    })

    it("should return empty string when both are null", () => {
      expect(formatPhoneOrEmail(null, null)).toBe("")
    })

    it("should return empty string when both are undefined", () => {
      expect(formatPhoneOrEmail(undefined, undefined)).toBe("")
    })

    it("should return empty string when called with no arguments", () => {
      expect(formatPhoneOrEmail()).toBe("")
    })

    it("should normalize phone-local dummy emails to the phone value", () => {
      expect(formatPhoneOrEmail("989123456789@phone.local", null)).toBe(
        "989123456789"
      )
    })

    it("should return empty string when empty strings are passed", () => {
      expect(formatPhoneOrEmail("", "")).toBe("")
    })

    it("should return whitespace email unchanged", () => {
      expect(formatPhoneOrEmail("   ", null)).toBe("   ")
    })
  })
})

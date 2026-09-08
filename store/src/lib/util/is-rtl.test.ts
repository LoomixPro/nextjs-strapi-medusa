import { isRtlLocale } from "./is-rtl"

describe("isRtlLocale", () => {
  it("identifies RTL locales correctly", () => {
    expect(isRtlLocale("fa")).toBe(true)
    expect(isRtlLocale("fa-IR")).toBe(true)
    expect(isRtlLocale("ar")).toBe(true)
    expect(isRtlLocale("ar-AE")).toBe(true)
    expect(isRtlLocale("ar-SA")).toBe(true)
    expect(isRtlLocale("he")).toBe(true)
    expect(isRtlLocale("ur")).toBe(true)
  })

  it("identifies LTR locales correctly", () => {
    expect(isRtlLocale("en")).toBe(false)
    expect(isRtlLocale("en-US")).toBe(false)
    expect(isRtlLocale("fr")).toBe(false)
    expect(isRtlLocale("de")).toBe(false)
    expect(isRtlLocale("default")).toBe(false)
    expect(isRtlLocale("")).toBe(false)
    expect(isRtlLocale(null)).toBe(false)
    expect(isRtlLocale(undefined)).toBe(false)
  })

  it("resolves default locale based on settings.isRtl", () => {
    expect(isRtlLocale("default", { isRtl: true })).toBe(true)
    expect(isRtlLocale("default", { isRtl: false })).toBe(false)
    expect(isRtlLocale(null, { isRtl: true })).toBe(true)
    expect(isRtlLocale(undefined, { isRtl: true })).toBe(true)
    expect(isRtlLocale("en", { isRtl: true })).toBe(false)
    expect(isRtlLocale("fa", { isRtl: false })).toBe(true)
  })
})

import { safeRedirectUrl } from "./safe-redirect"

describe("safeRedirectUrl", () => {
  it("allows relative paths", () => {
    expect(safeRedirectUrl("/account")).toBe("/account")
    expect(safeRedirectUrl("/us/cart")).toBe("/us/cart")
  })

  it("rejects external and protocol-relative URLs", () => {
    expect(safeRedirectUrl("https://evil.com")).toBe("/")
    expect(safeRedirectUrl("//evil.com")).toBe("/")
    expect(safeRedirectUrl("javascript:alert(1)")).toBe("/")
  })

  it("uses custom fallback", () => {
    expect(safeRedirectUrl(null, "/account")).toBe("/account")
    expect(safeRedirectUrl("https://evil.com", "/account")).toBe("/account")
  })
})

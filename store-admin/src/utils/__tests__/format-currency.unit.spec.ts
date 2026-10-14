import { formatCurrency } from "../format-currency"

describe("format-currency", () => {
  it("converts IRR to Toman by default for fa-IR", () => {
    const result = formatCurrency(1000000, "IRR", "fa-IR")
    expect(result.amount).toBe(100000)
    expect(result.currency).toBe("تومان")
    expect(result.label).toContain("تومان")
  })

  it("respects convertToToman: false option", () => {
    const result = formatCurrency(1000000, "irr", "fa-IR", { convertToToman: false })
    expect(result.amount).toBe(1000000)
    expect(result.currency).toBe("ریال")
  })

  it("formats AED in Arabic", () => {
    const result = formatCurrency(150, "AED", "ar-AE")
    expect(result.amount).toBe(150)
    expect(result.currency).toBe("درهم")
  })

  it("formats USD in English", () => {
    const result = formatCurrency(50, "USD", "en-US")
    expect(result.amount).toBe(50)
    expect(result.currency).toBe("USD")
  })
})

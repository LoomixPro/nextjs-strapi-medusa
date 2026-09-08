import { getPercentageDiff } from "./get-percentage-diff"

describe("getPercentageDiff", () => {
  it("should calculate the correct percentage decrease", () => {
    // Original price is 100, calculated price is 80. Expected output is 20%.
    const result = getPercentageDiff(100, 80)
    expect(result).toBe("20")
  })

  it("should return zero when there is no difference in prices", () => {
    // Original price and discounted price are the same.
    const result = getPercentageDiff(100, 100)
    expect(result).toBe("0")
  })

  it("should correctly round floating point numbers", () => {
    // Original price 300, discounted 200. Difference is 100. Percentage is 33.33% which rounds to 33.
    const result = getPercentageDiff(300, 200)
    expect(result).toBe("33")
  })

  it("should handle division by zero when both original and calculated are 0", () => {
    const result = getPercentageDiff(0, 0)
    expect(result).toBe("NaN")
  })

  it("should handle division by zero when original is 0 and calculated is non-zero", () => {
    const result = getPercentageDiff(0, 100)
    expect(result).toBe("-Infinity")
  })

  it("should return a negative percentage for price increases (calculated > original)", () => {
    const result = getPercentageDiff(100, 120)
    // (100 - 120) / 100 * 100 = -20
    expect(result).toBe("-20")
  })

  it("should handle negative number inputs", () => {
    const result = getPercentageDiff(-100, -80)
    // (-100 - -80) / -100 * 100 = -20 / -100 * 100 = 20
    expect(result).toBe("20")
  })
})

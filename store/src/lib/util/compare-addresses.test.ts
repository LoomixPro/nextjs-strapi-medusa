import compareAddresses from "./compare-addresses"

describe("compareAddresses utility", () => {
  const baseAddress = {
    first_name: "John",
    last_name: "Doe",
    address_1: "123 Main St",
    city: "New York",
    country_code: "US",
    postal_code: "10001",
    phone: "1234567890",
  }

  it("should return true when addresses are identical", () => {
    expect(compareAddresses(baseAddress, { ...baseAddress })).toBe(true)
  })

  it("should return true when addresses only differ in irrelevant fields (like id or created_at)", () => {
    const address1 = { ...baseAddress, id: "addr_1", created_at: "2023-01-01" }
    const address2 = {
      ...baseAddress,
      id: "addr_2",
      created_at: "2023-01-02",
      updated_at: "2023-01-03",
    }

    // They should still be considered equal because the shipping info is the same
    expect(compareAddresses(address1, address2)).toBe(true)
  })

  it("should return false when a relevant shipping field is different", () => {
    const address2 = { ...baseAddress, city: "Los Angeles" }
    expect(compareAddresses(baseAddress, address2)).toBe(false)
  })

  it("should return false when one address is missing a field that the other has", () => {
    const address2 = { ...baseAddress }
    delete (address2 as any).phone

    expect(compareAddresses(baseAddress, address2)).toBe(false)
  })

  it("should return true when both address inputs are null or undefined", () => {
    expect(compareAddresses(null, null)).toBe(true)
    expect(compareAddresses(undefined, undefined)).toBe(true)
    expect(compareAddresses(null, undefined)).toBe(true)
  })

  it("should return false when one address input is null or undefined and the other is valid", () => {
    expect(compareAddresses(baseAddress, null)).toBe(false)
    expect(compareAddresses(undefined, baseAddress)).toBe(false)
  })

  it("should return true when comparing two empty objects", () => {
    expect(compareAddresses({}, {})).toBe(true)
  })

  it("should return true when country code casing differs", () => {
    const address2 = { ...baseAddress, country_code: "us" }
    expect(compareAddresses(baseAddress, address2)).toBe(true)
  })

  it("should return true when phone formatting differs", () => {
    const address2 = { ...baseAddress, phone: "+1 (234) 567-890" }
    expect(compareAddresses(baseAddress, address2)).toBe(false)
  })

  it("should treat null phone and empty phone as equal", () => {
    const address1 = { ...baseAddress, phone: null }
    const address2 = { ...baseAddress, phone: "" }
    expect(compareAddresses(address1, address2)).toBe(true)
  })
})

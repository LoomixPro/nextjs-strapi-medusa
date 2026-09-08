import { resolveTimeZone } from "./resolve-time-zone"

describe("resolveTimeZone", () => {
  const originalTimezone = process.env.DEFAULT_TIMEZONE

  afterEach(() => {
    if (originalTimezone === undefined) {
      delete process.env.DEFAULT_TIMEZONE
    } else {
      process.env.DEFAULT_TIMEZONE = originalTimezone
    }
  })

  it("uses explicit timezone from Strapi settings when valid", () => {
    delete process.env.DEFAULT_TIMEZONE
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE
    expect(resolveTimeZone("Asia/Dubai")).toBe("Asia/Dubai")
    expect(resolveTimeZone("America/New_York")).toBe("America/New_York")
    expect(resolveTimeZone("Europe/London")).toBe("Europe/London")
    expect(resolveTimeZone("Asia/Tehran")).toBe("Asia/Tehran")
  })

  it("falls back to env override when explicit timezone is not provided", () => {
    process.env.DEFAULT_TIMEZONE = "Europe/Berlin"
    expect(resolveTimeZone(null)).toBe("Europe/Berlin")
    expect(resolveTimeZone(undefined)).toBe("Europe/Berlin")
  })

  it("gracefully falls back to UTC if an invalid timezone string is provided", () => {
    delete process.env.DEFAULT_TIMEZONE
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE
    expect(resolveTimeZone("Invalid/Timezone_Name")).toBe("UTC")
  })

  it("returns UTC by default when no timezone is specified", () => {
    delete process.env.DEFAULT_TIMEZONE
    delete process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE
    expect(resolveTimeZone()).toBe("UTC")
  })
})

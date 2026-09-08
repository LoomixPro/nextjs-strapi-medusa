import { resolveDir } from "./load-messages"

describe("resolveDir", () => {
  it("returns rtl for fa locale", () => {
    expect(resolveDir("fa-IR", { isRtl: false })).toBe("rtl")
  })

  it("returns rtl for ar locale", () => {
    expect(resolveDir("ar-AE", { isRtl: false })).toBe("rtl")
  })

  it("returns ltr for en locale", () => {
    expect(resolveDir("en-US", { isRtl: true })).toBe("ltr")
  })

  it("returns rtl for default locale when settings.isRtl is true", () => {
    expect(resolveDir("default", { isRtl: true })).toBe("rtl")
  })

  it("returns ltr for default locale when settings.isRtl is false", () => {
    expect(resolveDir("default", { isRtl: false })).toBe("ltr")
  })
})

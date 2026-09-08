import { resolveRequestLocale } from "./resolve-locale"
import { readCookie } from "@lib/util/safe-cookies"
import { LOCALE_COOKIE_NAME } from "./load-messages"

jest.mock("@lib/util/safe-cookies", () => ({
  readCookie: jest.fn(),
}))

const readCookieMock = readCookie as jest.MockedFunction<typeof readCookie>

describe("resolveRequestLocale", () => {
  beforeEach(() => {
    readCookieMock.mockReset()
  })

  it("returns cookie locale when set", async () => {
    readCookieMock.mockResolvedValue("fa-IR")

    await expect(resolveRequestLocale()).resolves.toBe("fa-IR")
    expect(readCookieMock).toHaveBeenCalledWith(LOCALE_COOKIE_NAME)
  })

  it("falls back to default when cookie is missing", async () => {
    readCookieMock.mockResolvedValue(undefined)

    await expect(resolveRequestLocale()).resolves.toBe("default")
  })

  it("falls back to default when cookie is default", async () => {
    readCookieMock.mockResolvedValue("default")

    await expect(resolveRequestLocale()).resolves.toBe("default")
  })
})

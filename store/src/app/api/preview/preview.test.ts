import { GET } from "./route"

// Mock next/headers
const mockEnable = jest.fn()
const mockDisable = jest.fn()
const mockSetCookie = jest.fn()

jest.mock("next/headers", () => ({
  draftMode: jest.fn().mockImplementation(() =>
    Promise.resolve({
      enable: mockEnable,
      disable: mockDisable,
    })
  ),
  cookies: jest.fn().mockImplementation(() =>
    Promise.resolve({
      set: mockSetCookie,
    })
  ),
}))

// Mock Response for Node/Jest environment if undefined
if (typeof (globalThis as any).Response === "undefined") {
  ;(globalThis as any).Response = class MockResponse {
    body: any
    status: number
    headers: Record<string, string>

    constructor(
      body: any,
      init?: { status?: number; headers?: Record<string, string> }
    ) {
      this.body = body
      this.status = init?.status ?? 200
      this.headers = init?.headers ?? {}
    }

    async json() {
      return typeof this.body === "string" ? JSON.parse(this.body) : this.body
    }
  }
}

// Mock next/navigation
const mockRedirect = jest.fn()
jest.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

describe("GET /api/preview", () => {
  const originalEnv = process.env.REVALIDATE_SECRET

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.REVALIDATE_SECRET = "super_secret_preview_token"
  })

  afterAll(() => {
    process.env.REVALIDATE_SECRET = originalEnv
  })

  it("returns 401 when secret parameter is missing", async () => {
    const req = {
      nextUrl: new URL("http://localhost:8000/api/preview"),
    } as any
    const res = await GET(req)

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe("Invalid preview secret")
  })

  it("returns 401 when secret parameter does not match REVALIDATE_SECRET", async () => {
    const req = {
      nextUrl: new URL(
        "http://localhost:8000/api/preview?secret=invalid_token"
      ),
    } as any
    const res = await GET(req)

    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe("Invalid preview secret")
  })

  it("enables draft mode and redirects when valid secret is provided", async () => {
    const req = {
      nextUrl: new URL(
        "http://localhost:8000/api/preview?secret=super_secret_preview_token&status=draft&uid=api::homepage.homepage"
      ),
    } as any

    try {
      await GET(req)
    } catch (e: any) {
      // Catch mock redirect error
      expect(e.message).toContain("NEXT_REDIRECT")
    }

    expect(mockEnable).toHaveBeenCalled()
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining("?preview=true")
    )
  })

  it("sets locale cookie if locale parameter is present", async () => {
    const req = {
      nextUrl: new URL(
        "http://localhost:8000/api/preview?secret=super_secret_preview_token&locale=fa-IR"
      ),
    } as any

    try {
      await GET(req)
    } catch {
      // Expected redirect thrown
    }

    expect(mockSetCookie).toHaveBeenCalledWith(
      "_medusa_locale",
      "fa-IR",
      expect.any(Object)
    )
  })
})

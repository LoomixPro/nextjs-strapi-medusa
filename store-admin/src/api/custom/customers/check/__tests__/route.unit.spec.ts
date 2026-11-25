import { POST } from "../route"

describe("POST /custom/customers/check", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("returns 401 in production when x-internal-secret is missing or invalid", async () => {
    process.env.NODE_ENV = "production"
    process.env.INTERNAL_API_SECRET = "strong-internal-secret"

    const json = jest.fn()
    const status = jest.fn(() => ({ json }))
    const req = {
      headers: {},
      body: { email: "user@example.com" },
      scope: { resolve: jest.fn() },
    } as any
    const res = { status, json } as any

    await POST(req, res)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: "Unauthorized" })
  })

  it("returns customer existence when valid internal secret is provided", async () => {
    process.env.NODE_ENV = "production"
    process.env.INTERNAL_API_SECRET = "strong-internal-secret"

    const graph = jest.fn().mockResolvedValue({ data: [{ id: "cus_1" }] })
    const json = jest.fn()
    const status = jest.fn(() => ({ json }))
    const req = {
      headers: { "x-internal-secret": "strong-internal-secret" },
      body: { email: "User@Example.com" },
      scope: { resolve: jest.fn(() => ({ graph })) },
    } as any
    const res = { status, json } as any

    await POST(req, res)

    expect(graph).toHaveBeenCalledWith({
      entity: "customer",
      fields: ["id"],
      filters: { email: "user@example.com" },
    })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ exists: true })
  })
})

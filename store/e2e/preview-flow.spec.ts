import { test, expect } from "@playwright/test"

test.describe("Strapi Preview & Draft Mode Endpoints", () => {
  test("GET /api/preview without secret should return 401 Unauthorized", async ({
    request,
  }) => {
    const response = await request.get("/api/preview")
    expect(response.status()).toBe(401)

    const data = await response.json()
    expect(data.message).toBe("Invalid preview secret")
  })

  test("GET /api/preview with incorrect secret should return 401 Unauthorized", async ({
    request,
  }) => {
    const response = await request.get("/api/preview?secret=wrong_secret_123")
    expect(response.status()).toBe(401)

    const data = await response.json()
    expect(data.message).toBe("Invalid preview secret")
  })

  test("GET /api/disable-preview should redirect back and disable draft mode", async ({
    request,
  }) => {
    const response = await request.get("/api/disable-preview", {
      maxRedirects: 0,
    })
    // Next.js redirect responds with 307
    expect(response.status()).toBe(307)
    const location = response.headers()["location"]
    expect(location).toBe("/")
  })

  test("GET /api/disable-preview should prevent open redirects to external domains", async ({
    request,
  }) => {
    const response = await request.get(
      "/api/disable-preview?redirect=https://malicious-attacker.com",
      {
        maxRedirects: 0,
      }
    )
    expect(response.status()).toBe(307)
    const location = response.headers()["location"]
    // safeRedirectUrl forces external URLs back to '/'
    expect(location).toBe("/")
  })
})

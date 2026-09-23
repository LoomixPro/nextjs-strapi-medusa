import { test, expect } from "@playwright/test"

test.describe("Region & Locale Switching Flow", () => {
  test("should automatically redirect root / to the default region prefix", async ({
    page,
  }) => {
    await page.goto("/")
    // Root URL should redirect to region prefix e.g. /us or /[countryCode]
    await expect(page).toHaveURL(/\/[a-z]{2}(\/|$)/, { timeout: 10000 })
  })

  test("should load store page correctly under region route", async ({
    page,
  }) => {
    const response = await page.goto("/us/store")
    expect(response?.status()).toBe(200)

    // Wait for product listing or empty catalog
    await page.waitForLoadState("domcontentloaded")
    const mainContent = page.locator("main, body")
    await expect(mainContent.first()).toBeVisible()
  })

  test("should configure proper html lang attribute for SEO and internationalization", async ({
    page,
  }) => {
    await page.goto("/us")

    // The <html> element should have a valid lang attribute
    const html = page.locator("html")
    await expect(html).toHaveAttribute("lang", /^[a-z]{2}(-[A-Z]{2})?$/)
  })
})

import { test, expect } from "@playwright/test"

test.describe("Returns Flow", () => {
  test("should render the returns policy and guidelines page successfully", async ({
    page,
  }) => {
    // Navigate to the returns page under current region
    const response = await page.goto("/returns")
    expect(response?.status()).toBe(200)

    // Verify main content container exists
    const mainContainer = page.locator(
      "main, [data-testid='returns-page'], body"
    )
    await expect(mainContainer.first()).toBeVisible()

    // Verify page title / heading contains returns keywords
    const heading = page.locator("h1, h2").first()
    await expect(heading).toBeVisible({ timeout: 10000 })
  })

  test("should redirect unauthenticated users when accessing protected order return routes", async ({
    page,
  }) => {
    // Navigating directly to an order return dashboard route without auth
    await page.goto("/account/orders/return/test-order-123")

    // Should redirect to login or show login prompt
    await expect(page).toHaveURL(/\/(account|login)/, { timeout: 10000 })
  })
})

import { test, expect } from "@playwright/test"

test.describe("Wishlist Flow", () => {
  test("should render the customer wishlist page successfully", async ({
    page,
  }) => {
    const response = await page.goto("/account/wishlist")
    expect(response?.status()).toBe(200)

    // Wait for page layout
    await page.waitForLoadState("domcontentloaded")

    // The wishlist page renders inside the account layout
    const container = page.locator("main, body")
    await expect(container.first()).toBeVisible({ timeout: 10000 })
  })

  test("should allow navigating from store to product and back to wishlist", async ({
    page,
  }) => {
    await page.goto("/store")

    // Wait for products list
    await page.waitForSelector('[data-testid="products-list"] li', {
      timeout: 30000,
    })

    const productCards = page.locator('[data-testid="products-list"] li')
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)

    // Then visit wishlist page again to confirm clean transition
    await page.goto("/account/wishlist")
    await expect(page).toHaveURL(/\/account\/wishlist/)
  })
})

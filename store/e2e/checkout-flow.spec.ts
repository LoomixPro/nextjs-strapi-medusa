import { test, expect } from "@playwright/test"

test.describe("Critical Sales Path", () => {
  test("should allow a user to add a product to cart and proceed to checkout", async ({
    page,
  }) => {
    // Navigate to the store home
    await page.goto("/store")

    // Find the first product link and click it
    await page.waitForSelector('[data-testid="products-list"] li a', {
      timeout: 60000,
    })
    const firstProduct = page
      .locator('[data-testid="products-list"] li a')
      .first()
    await firstProduct.click()

    // Now we are on the product page
    await expect(page).toHaveURL(/\/products\//, { timeout: 10000 })

    // Select options if they exist (Size, Color, etc)
    const optionContainers = page.locator('[data-testid="product-options"]')
    const optionsCount = await optionContainers.count()

    for (let i = 0; i < optionsCount; i++) {
      const container = optionContainers.nth(i)
      // Click the first available option button
      const firstButton = container
        .locator('[data-testid="option-button"]')
        .first()
      await firstButton.click()
    }

    // Wait a moment for variant logic and validation
    await page.waitForTimeout(1000)

    // Click "Add to cart"
    const addToCartBtn = page.locator('[data-testid="add-product-button"]')
    await expect(addToCartBtn).toBeEnabled({ timeout: 5000 })
    await addToCartBtn.click()

    // Wait for the cart server action to finish
    await page.waitForTimeout(2000)

    // Go to cart
    await page.goto("/cart")

    // Verify product is in cart
    const cartItems = page.locator('[data-testid="product-row"]')
    await expect(cartItems).toHaveCount(1, { timeout: 10000 })

    // Proceed to checkout
    const checkoutBtn = page.locator('[data-testid="checkout-button"]')
    await checkoutBtn.click()

    // Verify we reached checkout
    await expect(page).toHaveURL(/\/checkout/, { timeout: 10000 })
  })
})

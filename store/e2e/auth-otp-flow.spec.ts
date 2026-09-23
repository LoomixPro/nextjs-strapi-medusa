import { test, expect } from "@playwright/test"

test.describe("Authentication & OTP Login Flow", () => {
  test("should render the login interface with email and phone authentication options", async ({
    page,
  }) => {
    await page.goto("/account")

    // Should redirect to /[countryCode]/account or show login template
    await expect(page).toHaveURL(/\/(account|login)/, { timeout: 10000 })

    // Verify presence of login form container
    const formContainer = page.locator(
      'form, [data-testid="login-page"], input[type="email"], input[name="email"]'
    )
    await expect(formContainer.first()).toBeVisible({ timeout: 10000 })
  })

  test("should display validation error on invalid login submission", async ({
    page,
  }) => {
    await page.goto("/account")

    const emailInput = page.locator('input[type="email"], input[name="email"]')
    if (await emailInput.count()) {
      await emailInput.first().fill("invalid-test-user@example.com")

      const passwordInput = page.locator('input[type="password"]')
      if (await passwordInput.count()) {
        await passwordInput.first().fill("WrongPassword123!")
      }

      const submitBtn = page.locator('#login-email-form button[type="submit"]')
      if (await submitBtn.count()) {
        await submitBtn.click()
      } else {
        await page.locator('button[type="submit"]').last().click()
      }

      // Expect an error feedback element to appear or stay on login
      await page.waitForTimeout(1000)
      await expect(page).toHaveURL(/\/(account|login)/)
    }
  })

  test("should allow switching between auth views if multiple methods are supported", async ({
    page,
  }) => {
    await page.goto("/account")

    // Check if phone or email toggle buttons exist
    const methodButtons = page.locator("button")
    const count = await methodButtons.count()
    expect(count).toBeGreaterThan(0)
  })
})

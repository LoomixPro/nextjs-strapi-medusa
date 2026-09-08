import { render, screen, fireEvent } from "@testing-library/react"
import DiscountCode from "./index"

// Mock the translation library
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      add_promotion: "Add discount code",
      apply: "Apply",
      promotions_applied: "Applied promotions",
      remove_promotion: "Remove promotion",
    }
    return translations[key] || key
  },
}))

// Mock the cart data layer functions
jest.mock("@lib/data/cart", () => ({
  applyPromotions: jest.fn(),
}))

// Mock the submit button to avoid Next.js form errors
jest.mock(
  "../../../checkout/templates/styles/style-1/components/submit-button",
  () => ({
    SubmitButton: ({ children, ...props }: any) => (
      <button {...props}>{children}</button>
    ),
  })
)

describe("DiscountCode Component", () => {
  // A mock empty cart
  const mockCart: any = {
    promotions: [],
  }

  it("should display the 'Add discount code' button initially", () => {
    render(<DiscountCode cart={mockCart} />)

    const button = screen.getByTestId("add-discount-button")
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent("Add discount code")
  })

  it("should show the input field when the add button is clicked", () => {
    render(<DiscountCode cart={mockCart} />)

    const toggleButton = screen.getByTestId("add-discount-button")
    // Find the container grid that has opacity classes
    const inputContainer = screen
      .getByTestId("discount-input")
      .closest("form")
      ?.querySelector(".grid")

    // Initially the input is hidden (opacity-0 class)
    expect(inputContainer).toHaveClass("opacity-0")

    // User clicks the button
    fireEvent.click(toggleButton)

    // Now the field should become visible (opacity-100 class)
    expect(inputContainer).toHaveClass("opacity-100")
  })

  it("should display the promotion in the list if it is already applied", () => {
    // A mock cart with a 20% discount code
    const cartWithPromo: any = {
      promotions: [
        {
          id: "1",
          code: "SUMMER20",
          is_automatic: false,
          // Medusa checks currency_code even for percentages
          application_method: {
            type: "percentage",
            value: 20,
            currency_code: "usd",
          },
        },
      ],
    }

    render(<DiscountCode cart={cartWithPromo} />)

    // Check if the promotions applied heading exists
    expect(screen.getByText("Applied promotions")).toBeInTheDocument()

    // Check if the code SUMMER20 and 20% exist in the list
    const promoCode = screen.getByTestId("discount-code")
    expect(promoCode).toHaveTextContent("SUMMER20")
    expect(promoCode).toHaveTextContent("20%")
  })
})

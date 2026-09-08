import { render, screen, fireEvent } from "@testing-library/react"
import Addresses from "./index"

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/checkout",
  useSearchParams: () => new URLSearchParams("?step=address"),
}))

// Mock React 19's useActionState
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useActionState: (action: any, initialState: any) => [initialState, action],
}))

jest.mock("@lib/data/cart", () => ({
  setAddresses: jest.fn(),
}))

// Mock sub-components to isolate test
jest.mock("../shipping-address", () => {
  return function MockShippingAddress({ checked, onChange }: any) {
    return (
      <div data-testid="shipping-address-mock">
        <input
          type="checkbox"
          data-testid="same-as-billing-checkbox"
          checked={checked}
          onChange={onChange}
        />
      </div>
    )
  }
})
jest.mock("../billing_address", () => {
  return function MockBillingAddress() {
    return <div data-testid="billing-address-mock" />
  }
})
jest.mock("../submit-button", () => ({
  SubmitButton: function MockSubmitButton({ children, ...props }: any) {
    return <button {...props}>{children}</button>
  },
}))
jest.mock("../error-message", () => {
  return function MockErrorMessage() {
    return <div />
  }
})

describe("Addresses Component", () => {
  const mockCart = {
    id: "cart_1",
    email: "test@example.com",
    shipping_address: null,
    billing_address: null,
  }

  it("should render shipping form when step=address", () => {
    render(<Addresses cart={mockCart as any} customer={null} />)

    expect(screen.getByTestId("shipping-address-mock")).toBeInTheDocument()
    expect(screen.getByTestId("submit-address-button")).toBeInTheDocument()
  })

  it("should show billing address form when 'same as billing' is unchecked", () => {
    render(<Addresses cart={mockCart as any} customer={null} />)

    const checkbox = screen.getByTestId("same-as-billing-checkbox")

    // Initially it is true (checked) because shipping and billing are null so isEqual is true
    expect(checkbox).toBeChecked()
    expect(screen.queryByTestId("billing-address-mock")).not.toBeInTheDocument()

    // Uncheck it
    fireEvent.click(checkbox)

    expect(checkbox).not.toBeChecked()
    expect(screen.getByTestId("billing-address-mock")).toBeInTheDocument()
  })
})

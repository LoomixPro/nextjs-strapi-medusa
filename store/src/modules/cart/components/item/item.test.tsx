import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import Item from "./index"

jest.mock("@lib/data/cart", () => ({
  updateLineItem: jest.fn().mockResolvedValue(true),
}))

// Mock subcomponents
jest.mock("@modules/cart/components/cart-item-select", () => {
  return function MockCartItemSelect({ value, onChange, children }: any) {
    return (
      <select
        data-testid="product-select-button"
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    )
  }
})
jest.mock("@modules/common/components/localized-client-link", () => {
  return function MockLocalizedClientLink({ children }: any) {
    return <a>{children}</a>
  }
})
jest.mock("@modules/products/components/thumbnail", () => {
  return function MockThumbnail() {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt="" />
  }
})
jest.mock("@modules/common/components/line-item-options", () => {
  return function MockLineItemOptions() {
    return <div />
  }
})
jest.mock("@modules/common/components/delete-button", () => {
  return function MockDeleteButton() {
    return <button>Delete</button>
  }
})
jest.mock("@modules/common/components/line-item-unit-price", () => {
  return function MockLineItemUnitPrice() {
    return <span>Unit Price</span>
  }
})
jest.mock("@modules/common/components/line-item-price", () => {
  return function MockLineItemPrice() {
    return <span>Price</span>
  }
})
jest.mock(
  "@modules/checkout/templates/styles/style-1/components/error-message",
  () => {
    return function MockErrorMessage() {
      return <div />
    }
  }
)

// Mock Medusa UI elements that might use React context we don't have
jest.mock("@medusajs/ui", () => {
  const React = require("react")
  return {
    Table: {
      Row: ({ children }: any) => <tr>{children}</tr>,
      Cell: ({ children }: any) => <td>{children}</td>,
    },
    Text: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    clx: (...args: any[]) => args.join(" "),
  }
})

describe("Cart Item Component", () => {
  const mockItem = {
    id: "item_1",
    product_title: "Test Shirt",
    product_handle: "test-shirt",
    quantity: 2,
    variant: { manage_inventory: false },
  }

  it("should render the product title", () => {
    render(
      <table>
        <tbody>
          <Item item={mockItem as any} currencyCode="usd" />
        </tbody>
      </table>
    )
    expect(screen.getByTestId("product-title")).toHaveTextContent("Test Shirt")
  })

  it("should call updateLineItem when quantity is changed", async () => {
    const { updateLineItem } = require("@lib/data/cart")
    render(
      <table>
        <tbody>
          <Item item={mockItem as any} currencyCode="usd" />
        </tbody>
      </table>
    )

    const select = screen.getByTestId("product-select-button")
    expect(select).toHaveValue("2")

    // Change to 5
    fireEvent.change(select, { target: { value: "5" } })

    await waitFor(() => {
      expect(updateLineItem).toHaveBeenCalledWith({
        lineId: "item_1",
        quantity: 5,
      })
    })
  })
})

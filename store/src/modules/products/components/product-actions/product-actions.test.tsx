import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ProductActions from "./index"

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

jest.mock("@modules/common/components/dictionary-provider", () => ({
  useDictionary: () => (key: string) => key,
}))

jest.mock("next/navigation", () => ({
  useParams: () => ({ countryCode: "us" }),
  usePathname: () => "/test",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }),
}))

jest.mock("@lib/data/cart", () => ({
  addToCart: jest.fn().mockResolvedValue(null), // null means no error
}))

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock("@lib/hooks/use-in-view", () => ({
  useIntersection: () => true,
}))

// Mock OptionSelect to just be a simple select for easier testing
jest.mock("./option-select", () => {
  return function MockOptionSelect({ option, current, updateOption }: any) {
    return (
      <select
        data-testid={`select-${option.id}`}
        value={current || ""}
        onChange={(e) => updateOption(option.id, e.target.value)}
      >
        <option value="">Select</option>
        {option.values?.map((v: any) => (
          <option key={v.value} value={v.value}>
            {v.value}
          </option>
        ))}
      </select>
    )
  }
})

jest.mock("../product-price", () => {
  return function MockProductPrice() {
    return <div data-testid="product-price">Price</div>
  }
})

jest.mock("./mobile-actions", () => {
  return function MockMobileActions() {
    return <div data-testid="mobile-actions">Mobile</div>
  }
})

describe("ProductActions Component", () => {
  const mockProduct = {
    id: "prod_1",
    options: [{ id: "opt_1", title: "Size", values: [{ value: "Large" }] }],
    variants: [
      {
        id: "var_1",
        options: [{ option_id: "opt_1", value: "Large" }],
        manage_inventory: true,
        inventory_quantity: 10,
        allow_backorder: false,
      },
      {
        id: "var_2",
        options: [{ option_id: "opt_1", value: "Small" }],
        manage_inventory: true,
        inventory_quantity: 10,
        allow_backorder: false,
      },
    ],
  }

  const mockRegion = { id: "reg_1", currency_code: "usd" }

  it("should have add to cart disabled initially if options are not selected", () => {
    render(
      <ProductActions product={mockProduct as any} region={mockRegion as any} />
    )

    const btn = screen.getByTestId("add-product-button")
    expect(btn).toBeDisabled()
    expect(btn).toHaveTextContent("select_variant")
  })

  it("should enable button when valid option is selected and call addToCart on click", async () => {
    const { addToCart } = require("@lib/data/cart")
    render(
      <ProductActions product={mockProduct as any} region={mockRegion as any} />
    )

    // Select the "Large" option
    const select = screen.getByTestId("select-opt_1")
    fireEvent.change(select, { target: { value: "Large" } })

    const btn = screen.getByTestId("add-product-button")

    await waitFor(() => {
      expect(btn).not.toBeDisabled()
      expect(btn).toHaveTextContent("add_to_cart")
    })

    fireEvent.click(btn)

    await waitFor(() => {
      expect(addToCart).toHaveBeenCalledWith({
        variantId: "var_1",
        quantity: 1,
        countryCode: "us",
      })
    })
  })
})

import { renderHook, act } from "@testing-library/react"
import { useProductActions } from "./use-product-actions"

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
jest.mock("next/navigation", () => {
  const mockRouter = { replace: jest.fn(), refresh: jest.fn() }
  const mockSearchParams = { get: jest.fn(), toString: () => "" }
  const mockParams = { countryCode: "us" }
  return {
    useRouter: () => mockRouter,
    useSearchParams: () => mockSearchParams,
    useParams: () => mockParams,
  }
})

// Mock cart action
jest.mock("@lib/data/cart", () => ({
  addToCart: jest.fn().mockResolvedValue(null),
}))

// Mock getProductPrice
jest.mock("@lib/util/get-product-price", () => ({
  getProductPrice: jest.fn().mockReturnValue({
    variantPrice: { calculated_price_number: 100, currency_code: "usd" },
  }),
}))

// Mock sonner and GTM
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("@next/third-parties/google", () => ({
  sendGTMEvent: jest.fn(),
}))

describe("useProductActions", () => {
  const mockProduct: any = {
    id: "prod_1",
    title: "Test Product",
    options: [
      { id: "opt_color", title: "Color" },
      { id: "opt_size", title: "Size" },
    ],
    variants: [
      {
        id: "var_1",
        options: [
          { option_id: "opt_color", value: "Red", option: { title: "Color" } },
          { option_id: "opt_size", value: "Small", option: { title: "Size" } },
        ],
        manage_inventory: true,
        allow_backorder: false,
        inventory_quantity: 5,
        metadata: { color_code: "#ff0000" },
      },
      {
        id: "var_2",
        options: [
          { option_id: "opt_color", value: "Blue", option: { title: "Color" } },
          { option_id: "opt_size", value: "Small", option: { title: "Size" } },
        ],
        manage_inventory: true,
        allow_backorder: true, // Backorder allowed
        inventory_quantity: 0,
        metadata: { color_code: "#0000ff" },
      },
      {
        id: "var_3",
        options: [
          { option_id: "opt_color", value: "Red", option: { title: "Color" } },
          { option_id: "opt_size", value: "Large", option: { title: "Size" } },
        ],
        manage_inventory: false, // Don't manage inventory
        allow_backorder: false,
        inventory_quantity: 0,
        metadata: { color_code: "#ff0000" },
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with first variant options if URL has no v_id", () => {
    const { result } = renderHook(() =>
      useProductActions({ product: mockProduct })
    )

    // Default options should be from first variant (var_1)
    expect(result.current.options).toEqual({
      opt_color: "Red",
      opt_size: "Small",
    })
    expect(result.current.selectedVariant?.id).toBe("var_1")
  })

  it("should extract colorCodeMap correctly", () => {
    const { result } = renderHook(() =>
      useProductActions({ product: mockProduct })
    )

    const colorMap = result.current.colorCodeMap
    expect(colorMap.get("red")).toBe("#ff0000")
    expect(colorMap.get("blue")).toBe("#0000ff")
  })

  it("isValidVariant should return true for valid combination", () => {
    const { result } = renderHook(() =>
      useProductActions({ product: mockProduct })
    )

    expect(result.current.isValidVariant).toBe(true)

    // Set invalid combination
    act(() => {
      result.current.setOptionValue("opt_size", "Medium")
    })

    expect(result.current.isValidVariant).toBe(false)
  })

  describe("inStock logic", () => {
    it("should return true when manage_inventory is true and quantity > 0", () => {
      const { result } = renderHook(() =>
        useProductActions({ product: mockProduct })
      )
      expect(result.current.inStock).toBe(true) // var_1
    })

    it("should return true when allow_backorder is true even if quantity is 0", () => {
      const { result } = renderHook(() =>
        useProductActions({ product: mockProduct })
      )

      act(() => {
        result.current.setOptions({ opt_color: "Blue", opt_size: "Small" }) // var_2
      })

      expect(result.current.inStock).toBe(true)
    })

    it("should return true when manage_inventory is false even if quantity is 0", () => {
      const { result } = renderHook(() =>
        useProductActions({ product: mockProduct })
      )

      act(() => {
        result.current.setOptions({ opt_color: "Red", opt_size: "Large" }) // var_3
      })

      expect(result.current.inStock).toBe(true)
    })

    it("should return false when manage_inventory is true, no backorder, and quantity is 0", () => {
      const outOfStockProduct = {
        ...mockProduct,
        variants: [
          {
            id: "var_oos",
            options: [{ option_id: "opt_color", value: "Green" }],
            manage_inventory: true,
            allow_backorder: false,
            inventory_quantity: 0,
          },
        ],
      }

      const { result } = renderHook(() =>
        useProductActions({ product: outOfStockProduct })
      )
      expect(result.current.inStock).toBe(false)
    })
  })

  describe("handleColorChange", () => {
    it("should keep the same size if new color variant exists with that size", () => {
      const { result } = renderHook(() =>
        useProductActions({ product: mockProduct })
      )

      // Currently Red/Small. Switch to Blue
      act(() => {
        result.current.handleColorChange("Blue")
      })

      // Should find Blue/Small (var_2)
      expect(result.current.options).toEqual({
        opt_color: "Blue",
        opt_size: "Small",
      })
    })

    it("should fallback to the first variant of the new color if exact size combination does not exist", () => {
      const { result } = renderHook(() =>
        useProductActions({ product: mockProduct })
      )

      // Start at Red/Large
      act(() => {
        result.current.setOptions({ opt_color: "Red", opt_size: "Large" })
      })

      // Switch to Blue. Blue/Large doesn't exist. It should fallback to Blue/Small (var_2)
      act(() => {
        result.current.handleColorChange("Blue")
      })

      expect(result.current.options).toEqual({
        opt_color: "Blue",
        opt_size: "Small",
      })
    })
  })
})

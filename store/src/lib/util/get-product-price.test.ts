import { getProductPrice, getPricesForVariant } from "./get-product-price"

// Mock the money format function to make tests deterministic
jest.mock("./storefront-settings", () => ({
  convertToLocale: ({ amount }: { amount: number }) => `formatted_${amount}`,
}))

// Mock percentage diff utility
jest.mock("./get-percentage-diff", () => ({
  getPercentageDiff: () => "10",
}))

describe("get-product-price utilities", () => {
  describe("getPricesForVariant", () => {
    it("should return null if calculated_amount is missing", () => {
      expect(getPricesForVariant({})).toBeNull()
      expect(getPricesForVariant({ calculated_price: {} })).toBeNull()
    })

    it("should format and return price object correctly when calculated_price is defined", () => {
      const variant = {
        calculated_price: {
          calculated_amount: 90,
          original_amount: 100,
          currency_code: "usd",
          calculated_price: { price_list_type: "sale" },
        },
      }
      const result = getPricesForVariant(variant)

      expect(result).toEqual({
        calculated_price_number: 90,
        calculated_price: "formatted_90",
        original_price_number: 100,
        original_price: "formatted_100",
        currency_code: "usd",
        price_type: "sale",
        percentage_diff: "10",
      })
    })

    it("should handle variants safely when calculated_price.calculated_price is undefined", () => {
      const variant = {
        calculated_price: {
          calculated_amount: 100,
          original_amount: 100,
          currency_code: "usd",
        },
      }
      const result = getPricesForVariant(variant)

      expect(result).toEqual({
        calculated_price_number: 100,
        calculated_price: "formatted_100",
        original_price_number: 100,
        original_price: "formatted_100",
        currency_code: "usd",
        price_type: undefined,
        percentage_diff: "10",
      })
    })
  })

  describe("getProductPrice", () => {
    it("should throw an error if no product is provided", () => {
      expect(() => getProductPrice({ product: null as any })).toThrow(
        "No product provided"
      )
    })

    it("should find the cheapest price among all variants", () => {
      const product = {
        id: "prod_1",
        variants: [
          {
            calculated_price: {
              calculated_amount: 150,
              original_amount: 150,
              currency_code: "usd",
              calculated_price: { price_list_type: "default" },
            },
          },
          {
            calculated_price: {
              calculated_amount: 90,
              original_amount: 100,
              currency_code: "usd",
              calculated_price: { price_list_type: "sale" },
            },
          },
        ],
      }

      const result = getProductPrice({ product: product as any })
      expect(result.cheapestPrice?.calculated_price_number).toBe(90)
      expect(result.variantPrice).toBeNull()
    })

    it("should return a specific variant price if variantId is provided", () => {
      const product = {
        id: "prod_1",
        variants: [
          {
            id: "var_1",
            calculated_price: {
              calculated_amount: 150,
              original_amount: 150,
              currency_code: "usd",
              calculated_price: { price_list_type: "default" },
            },
          },
        ],
      }

      const result = getProductPrice({
        product: product as any,
        variantId: "var_1",
      })
      expect(result.variantPrice?.calculated_price_number).toBe(150)
    })

    it("should return null for cheapestPrice if product variants array is empty or missing", () => {
      const productNoVariants = { id: "prod_1", variants: [] }
      const result1 = getProductPrice({ product: productNoVariants as any })
      expect(result1.cheapestPrice).toBeNull()

      const productMissingVariants = { id: "prod_1" }
      const result2 = getProductPrice({
        product: productMissingVariants as any,
      })
      expect(result2.cheapestPrice).toBeNull()
    })

    it("should filter out variants that don't have calculated_price when finding cheapestPrice", () => {
      const product = {
        id: "prod_1",
        variants: [
          { id: "var_1" }, // no calculated_price
          {
            id: "var_3",
            calculated_price: {
              calculated_amount: 200,
              original_amount: 200,
              currency_code: "usd",
              calculated_price: { price_list_type: "default" },
            },
          },
        ],
      }
      const result = getProductPrice({ product: product as any })
      expect(result.cheapestPrice?.calculated_price_number).toBe(200)
    })

    it("should identify variant when variantId matches the variant's SKU instead of ID", () => {
      const product = {
        id: "prod_1",
        variants: [
          {
            id: "var_1",
            sku: "sku_123",
            calculated_price: {
              calculated_amount: 150,
              original_amount: 150,
              currency_code: "usd",
              calculated_price: { price_list_type: "default" },
            },
          },
        ],
      }
      const result = getProductPrice({
        product: product as any,
        variantId: "sku_123",
      })
      expect(result.variantPrice?.calculated_price_number).toBe(150)
    })
  })
})

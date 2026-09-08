import { sortProducts } from "./sort-products"

describe("sortProducts utility", () => {
  const products: any[] = [
    {
      id: "prod_1",
      created_at: "2023-01-01T00:00:00.000Z",
      variants: [{ calculated_price: { calculated_amount: 200 } }],
    },
    {
      id: "prod_2",
      created_at: "2023-01-03T00:00:00.000Z",
      variants: [
        { calculated_price: { calculated_amount: 50 } },
        { calculated_price: { calculated_amount: 150 } },
      ],
    },
    {
      id: "prod_3",
      created_at: "2023-01-02T00:00:00.000Z",
      variants: [{ calculated_price: { calculated_amount: 100 } }],
    },
  ]

  it("should sort products by their lowest variant price ascending", () => {
    // Expected order: prod_2 (50), prod_3 (100), prod_1 (200)
    const result = sortProducts([...products], "price_asc" as any)

    expect(result[0].id).toBe("prod_2")
    expect(result[1].id).toBe("prod_3")
    expect(result[2].id).toBe("prod_1")
  })

  it("should sort products by their lowest variant price descending", () => {
    // Expected order: prod_1 (200), prod_3 (100), prod_2 (50)
    const result = sortProducts([...products], "price_desc" as any)

    expect(result[0].id).toBe("prod_1")
    expect(result[1].id).toBe("prod_3")
    expect(result[2].id).toBe("prod_2")
  })

  it("should sort products by created_at with newest first", () => {
    // Expected order: prod_2 (Jan 3), prod_3 (Jan 2), prod_1 (Jan 1)
    const result = sortProducts([...products], "created_at" as any)

    expect(result[0].id).toBe("prod_2")
    expect(result[1].id).toBe("prod_3")
    expect(result[2].id).toBe("prod_1")
  })
})

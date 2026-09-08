import {
  calculateReturnableQuantity,
  isItemReturnable,
  getReturnDeliveryStatus,
  getReturnRemainingDays,
  hasReturnableItems,
  enhanceItemsWithReturnStatus,
} from "./returns"

// Helper to create a mock order line item with detail
const createItem = (overrides: Record<string, any> = {}) => ({
  id: "item_1",
  title: "Test Product",
  quantity: 2,
  detail: {
    delivered_quantity: 2,
    return_requested_quantity: 0,
    return_received_quantity: 0,
    written_off_quantity: 0,
    ...overrides,
  },
})

// Helper to create a mock order with fulfillments
const createOrder = (fulfillments: any[] = [], items: any[] = []) => ({
  id: "order_1",
  fulfillments,
  items,
})

describe("returns utility", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date("2024-06-15T12:00:00Z"))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  // ─── calculateReturnableQuantity ───────────────────────────────────

  describe("calculateReturnableQuantity", () => {
    it("should return full delivered quantity when nothing has been returned", () => {
      const item = createItem({ delivered_quantity: 3 })
      expect(calculateReturnableQuantity(item as any)).toBe(3)
    })

    it("should subtract return_requested_quantity from delivered", () => {
      const item = createItem({
        delivered_quantity: 5,
        return_requested_quantity: 2,
      })
      expect(calculateReturnableQuantity(item as any)).toBe(3)
    })

    it("should subtract return_received_quantity from delivered", () => {
      const item = createItem({
        delivered_quantity: 5,
        return_received_quantity: 3,
      })
      expect(calculateReturnableQuantity(item as any)).toBe(2)
    })

    it("should subtract written_off_quantity from delivered", () => {
      const item = createItem({
        delivered_quantity: 5,
        written_off_quantity: 1,
      })
      expect(calculateReturnableQuantity(item as any)).toBe(4)
    })

    it("should subtract all quantities combined", () => {
      const item = createItem({
        delivered_quantity: 10,
        return_requested_quantity: 2,
        return_received_quantity: 3,
        written_off_quantity: 1,
      })
      // 10 - 2 - 3 - 1 = 4
      expect(calculateReturnableQuantity(item as any)).toBe(4)
    })

    it("should return 0 when subtractions exceed delivered quantity", () => {
      const item = createItem({
        delivered_quantity: 2,
        return_requested_quantity: 3,
      })
      expect(calculateReturnableQuantity(item as any)).toBe(0)
    })

    it("should return 0 when delivered_quantity is 0", () => {
      const item = createItem({ delivered_quantity: 0 })
      expect(calculateReturnableQuantity(item as any)).toBe(0)
    })

    it("should handle missing detail fields gracefully (default to 0)", () => {
      const item = { id: "item_1", detail: {} }
      expect(calculateReturnableQuantity(item as any)).toBe(0)
    })

    it("should handle undefined detail gracefully", () => {
      const item = { id: "item_1" }
      expect(calculateReturnableQuantity(item as any)).toBe(0)
    })
  })

  // ─── isItemReturnable ─────────────────────────────────────────────

  describe("isItemReturnable", () => {
    it("should return true when returnable quantity > 0", () => {
      const item = createItem({ delivered_quantity: 3 })
      expect(isItemReturnable(item as any)).toBe(true)
    })

    it("should return false when returnable quantity is 0", () => {
      const item = createItem({
        delivered_quantity: 2,
        return_requested_quantity: 2,
      })
      expect(isItemReturnable(item as any)).toBe(false)
    })

    it("should return false when nothing was delivered", () => {
      const item = createItem({ delivered_quantity: 0 })
      expect(isItemReturnable(item as any)).toBe(false)
    })
  })

  // ─── getReturnDeliveryStatus ──────────────────────────────────────

  describe("getReturnDeliveryStatus", () => {
    it("should return isShipped=false when there are no fulfillments", () => {
      const order = createOrder([])
      const result = getReturnDeliveryStatus(order as any)
      expect(result.isShipped).toBe(false)
      expect(result.shipmentDate).toBeNull()
    })

    it("should return isShipped=false when fulfillments have no shipped_at", () => {
      const order = createOrder([{ id: "ful_1", shipped_at: null }])
      const result = getReturnDeliveryStatus(order as any)
      expect(result.isShipped).toBe(false)
      expect(result.shipmentDate).toBeNull()
    })

    it("should return isShipped=true with the latest shipment date", () => {
      const order = createOrder([
        { id: "ful_1", shipped_at: "2024-01-01T00:00:00Z" },
        { id: "ful_2", shipped_at: "2024-01-05T00:00:00Z" },
        { id: "ful_3", shipped_at: "2024-01-03T00:00:00Z" },
      ])
      const result = getReturnDeliveryStatus(order as any)
      expect(result.isShipped).toBe(true)
      expect(result.shipmentDate).toEqual(new Date("2024-01-05T00:00:00Z"))
    })

    it("should handle single fulfillment correctly", () => {
      const order = createOrder([
        { id: "ful_1", shipped_at: "2024-06-15T10:00:00Z" },
      ])
      const result = getReturnDeliveryStatus(order as any)
      expect(result.isShipped).toBe(true)
      expect(result.shipmentDate).toEqual(new Date("2024-06-15T10:00:00Z"))
    })

    it("should handle order without fulfillments property", () => {
      const order = { id: "order_1" }
      const result = getReturnDeliveryStatus(order as any)
      expect(result.isShipped).toBe(false)
      expect(result.shipmentDate).toBeNull()
    })
  })

  // ─── getReturnRemainingDays ───────────────────────────────────────

  describe("getReturnRemainingDays", () => {
    it("should return full deadline when order has not been shipped", () => {
      const order = createOrder([])
      expect(getReturnRemainingDays(order as any, 7)).toBe(7)
    })

    it("should return full deadline with custom deadline days", () => {
      const order = createOrder([])
      expect(getReturnRemainingDays(order as any, 14)).toBe(14)
    })

    it("should calculate remaining days correctly for recently shipped order", () => {
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }])
      const remaining = getReturnRemainingDays(order as any, 7)
      expect(remaining).toBe(5)
    })

    it("should return 0 when deadline has passed", () => {
      // Shipped 10 days ago (shipped_at: 2024-06-05T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-05T12:00:00Z" }])
      const remaining = getReturnRemainingDays(order as any, 7)
      expect(remaining).toBe(0)
    })

    it("should return 0 when deadline is exactly today", () => {
      // Shipped exactly 7 days ago (shipped_at: 2024-06-08T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-08T12:00:00Z" }])
      const remaining = getReturnRemainingDays(order as any, 7)
      expect(remaining).toBe(0)
    })

    it("should calculate remaining days correctly for future shipped order", () => {
      // Shipped 2 days in the future (shipped_at: 2024-06-17T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-17T12:00:00Z" }])
      const remaining = getReturnRemainingDays(order as any, 7)
      expect(remaining).toBe(9)
    })
  })

  // ─── hasReturnableItems ───────────────────────────────────────────

  describe("hasReturnableItems", () => {
    it("should return false when order has not been shipped", () => {
      const items = [createItem({ delivered_quantity: 2 })]
      const order = createOrder([], items)
      expect(hasReturnableItems(order as any, 7)).toBe(false)
    })

    it("should return false when return deadline has passed", () => {
      // Shipped 10 days ago (shipped_at: 2024-06-05T12:00:00Z)
      const items = [createItem({ delivered_quantity: 2 })]
      const order = createOrder([{ shipped_at: "2024-06-05T12:00:00Z" }], items)
      expect(hasReturnableItems(order as any, 7)).toBe(false)
    })

    it("should return true when order is shipped, within deadline, and has returnable items", () => {
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const items = [createItem({ delivered_quantity: 2 })]
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }], items)
      expect(hasReturnableItems(order as any, 7)).toBe(true)
    })

    it("should return false when all items are already returned", () => {
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const items = [
        createItem({
          delivered_quantity: 2,
          return_requested_quantity: 2,
        }),
      ]
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }], items)
      expect(hasReturnableItems(order as any, 7)).toBe(false)
    })

    it("should return true if at least one item is returnable", () => {
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const items = [
        createItem({
          delivered_quantity: 2,
          return_requested_quantity: 2,
        }),
        createItem({ delivered_quantity: 1 }),
      ]
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }], items)
      expect(hasReturnableItems(order as any, 7)).toBe(true)
    })

    it("should return false when items array is empty", () => {
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }], [])
      expect(hasReturnableItems(order as any, 7)).toBe(false)
    })

    it("should handle negative or missing detail quantities gracefully when calculating returns", () => {
      const items = [
        createItem({
          delivered_quantity: -1, // invalid negative value
          return_requested_quantity: 2,
        }),
      ]
      // Shipped 2 days ago (shipped_at: 2024-06-13T12:00:00Z)
      const order = createOrder([{ shipped_at: "2024-06-13T12:00:00Z" }], items)
      expect(hasReturnableItems(order as any, 7)).toBe(false)
    })
  })

  // ─── enhanceItemsWithReturnStatus ─────────────────────────────────

  describe("enhanceItemsWithReturnStatus", () => {
    it("should add deliveredQuantity, returnableQuantity, isDelivered, and isReturnable", () => {
      const items = [
        createItem({ delivered_quantity: 3, return_requested_quantity: 1 }),
      ]
      const result = enhanceItemsWithReturnStatus(items as any)

      expect(result).toHaveLength(1)
      expect(result[0].deliveredQuantity).toBe(3)
      expect(result[0].returnableQuantity).toBe(2)
      expect(result[0].isDelivered).toBe(true)
      expect(result[0].isReturnable).toBe(true)
    })

    it("should mark item as not delivered when delivered_quantity is 0", () => {
      const items = [createItem({ delivered_quantity: 0 })]
      const result = enhanceItemsWithReturnStatus(items as any)

      expect(result[0].isDelivered).toBe(false)
      expect(result[0].isReturnable).toBe(false)
    })

    it("should mark item as not returnable when fully returned", () => {
      const items = [
        createItem({
          delivered_quantity: 2,
          return_received_quantity: 2,
        }),
      ]
      const result = enhanceItemsWithReturnStatus(items as any)

      expect(result[0].isDelivered).toBe(true)
      expect(result[0].isReturnable).toBe(false)
      expect(result[0].returnableQuantity).toBe(0)
    })

    it("should handle multiple items correctly", () => {
      const items = [
        createItem({ delivered_quantity: 5, return_requested_quantity: 2 }),
        createItem({ delivered_quantity: 0 }),
        createItem({
          delivered_quantity: 3,
          return_received_quantity: 3,
        }),
      ]
      const result = enhanceItemsWithReturnStatus(items as any)

      expect(result).toHaveLength(3)
      // First item: 5 delivered, 2 requested → 3 returnable
      expect(result[0].returnableQuantity).toBe(3)
      expect(result[0].isReturnable).toBe(true)
      // Second item: not delivered
      expect(result[1].isDelivered).toBe(false)
      expect(result[1].isReturnable).toBe(false)
      // Third item: fully returned
      expect(result[2].isDelivered).toBe(true)
      expect(result[2].isReturnable).toBe(false)
    })

    it("should preserve original item properties", () => {
      const items = [createItem({ delivered_quantity: 1 })]
      const result = enhanceItemsWithReturnStatus(items as any)

      expect(result[0].id).toBe("item_1")
      expect(result[0].title).toBe("Test Product")
    })
  })
})

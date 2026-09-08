import {
  retrieveOrder,
  listOrders,
  createTransferRequest,
  acceptTransferRequest,
  declineTransferRequest,
  createReturnRequest,
  listReturnReasons,
} from "./orders"
import { sdk } from "@lib/config"

jest.mock("next/cache", () => ({ revalidateTag: jest.fn() }))
jest.mock("./cookies", () => ({
  getAuthHeaders: jest.fn().mockResolvedValue({ authorization: "Bearer mock" }),
  getCacheOptions: jest.fn().mockResolvedValue({}),
}))

jest.mock("@lib/config", () => ({
  sdk: {
    client: {
      fetch: jest.fn(),
    },
    store: {
      order: {
        requestTransfer: jest
          .fn()
          .mockResolvedValue({ order: { id: "ord_1" } }),
        acceptTransfer: jest.fn().mockResolvedValue({ order: { id: "ord_1" } }),
        declineTransfer: jest
          .fn()
          .mockResolvedValue({ order: { id: "ord_1" } }),
      },
    },
  },
}))

describe("Orders Data Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("retrieveOrder", () => {
    it("should fetch and return order by id", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        order: { id: "ord_123" },
      })

      const result = await retrieveOrder("ord_123")

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/orders/ord_123",
        expect.objectContaining({ method: "GET" })
      )
      expect(result).toEqual({ id: "ord_123" })
    })

    it("should propagate error on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to retrieve order")
      )
      await expect(retrieveOrder("ord_123")).rejects.toThrow(
        "Failed to retrieve order"
      )
    })
  })

  describe("listOrders", () => {
    it("should fetch and return orders list", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        orders: [{ id: "ord_1" }],
      })

      const result = await listOrders(10, 0, { test: "filter" })

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/orders",
        expect.objectContaining({
          method: "GET",
          query: expect.objectContaining({
            limit: 10,
            offset: 0,
            test: "filter",
          }),
        })
      )
      expect(result).toEqual([{ id: "ord_1" }])
    })

    it("should propagate error on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to list orders")
      )
      await expect(listOrders(10, 0)).rejects.toThrow("Failed to list orders")
    })
  })

  describe("createTransferRequest", () => {
    it("should call requestTransfer and return order", async () => {
      const formData = new FormData()
      formData.append("order_id", "ord_1")

      const result = await createTransferRequest(
        { success: false, error: null, order: null },
        formData
      )

      expect(sdk.store.order.requestTransfer).toHaveBeenCalledWith(
        "ord_1",
        {},
        expect.any(Object),
        { authorization: "Bearer mock" }
      )
      expect(result.success).toBe(true)
      expect(result.order).toEqual({ id: "ord_1" })
    })

    it("should return error if order_id is missing", async () => {
      const formData = new FormData()

      const result = await createTransferRequest(
        { success: false, error: null, order: null },
        formData
      )

      expect(sdk.store.order.requestTransfer).not.toHaveBeenCalled()
      expect(result.success).toBe(false)
      expect(result.error).toBe("Order ID is required")
    })

    it("should return success=false on requestTransfer rejection", async () => {
      ;(sdk.store.order.requestTransfer as jest.Mock).mockRejectedValueOnce(
        new Error("Transfer failed")
      )
      const formData = new FormData()
      formData.append("order_id", "ord_1")

      const result = await createTransferRequest(
        { success: false, error: null, order: null },
        formData
      )
      expect(result).toEqual({
        success: false,
        error: "Transfer failed",
        order: null,
      })
    })
  })

  describe("acceptTransferRequest / declineTransferRequest", () => {
    it("should accept transfer successfully", async () => {
      const result = await acceptTransferRequest("ord_1", "tok_123")
      expect(sdk.store.order.acceptTransfer).toHaveBeenCalledWith(
        "ord_1",
        { token: "tok_123" },
        {},
        { authorization: "Bearer mock" }
      )
      expect(result.success).toBe(true)
    })

    it("should return success=false on acceptTransfer rejection", async () => {
      ;(sdk.store.order.acceptTransfer as jest.Mock).mockRejectedValueOnce(
        new Error("Accept failed")
      )
      const result = await acceptTransferRequest("ord_1", "tok_123")
      expect(result).toEqual({
        success: false,
        error: "Accept failed",
        order: null,
      })
    })

    it("should decline transfer successfully", async () => {
      const result = await declineTransferRequest("ord_1", "tok_123")
      expect(sdk.store.order.declineTransfer).toHaveBeenCalledWith(
        "ord_1",
        { token: "tok_123" },
        {},
        { authorization: "Bearer mock" }
      )
      expect(result.success).toBe(true)
    })

    it("should return success=false on declineTransfer rejection", async () => {
      ;(sdk.store.order.declineTransfer as jest.Mock).mockRejectedValueOnce(
        new Error("Decline failed")
      )
      const result = await declineTransferRequest("ord_1", "tok_123")
      expect(result).toEqual({
        success: false,
        error: "Decline failed",
        order: null,
      })
    })
  })

  describe("createReturnRequest", () => {
    it("should create return request", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        return: { id: "ret_1" },
      })

      const formData = new FormData()
      formData.append("order_id", "ord_1")
      formData.append(
        "items",
        JSON.stringify([
          { id: "item_1", quantity: 1, return_reason_id: "reason_1" },
        ])
      )
      formData.append("return_shipping_option_id", "opt_1")

      const result = await createReturnRequest(
        { success: false, error: null, return: null },
        formData
      )

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/returns",
        expect.objectContaining({
          method: "POST",
          body: {
            order_id: "ord_1",
            items: [
              { id: "item_1", quantity: 1, reason_id: "reason_1", note: null },
            ],
            return_shipping: { option_id: "opt_1" },
            location_id: null,
          },
        })
      )
      expect(result.success).toBe(true)
    })

    it("should return success=false on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("API Error")
      )

      const formData = new FormData()
      formData.append("order_id", "ord_1")
      formData.append("items", JSON.stringify([{ id: "item_1", quantity: 1 }]))
      formData.append("return_shipping_option_id", "opt_1")

      const result = await createReturnRequest(
        { success: false, error: null, return: null },
        formData
      )
      expect(result).toEqual({
        success: false,
        error: "API Error",
        return: null,
      })
    })
  })

  describe("listReturnReasons", () => {
    it("should fetch return reasons", async () => {
      ;(sdk.client.fetch as jest.Mock).mockResolvedValueOnce({
        return_reasons: [{ id: "reason_1" }],
      })

      const result = await listReturnReasons()

      expect(sdk.client.fetch).toHaveBeenCalledWith(
        "/store/return-reasons",
        expect.objectContaining({ method: "GET" })
      )
      expect(result).toEqual([{ id: "reason_1" }])
    })

    it("should return empty array on fetch failure", async () => {
      ;(sdk.client.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("API Error")
      )
      const result = await listReturnReasons()
      expect(result).toEqual([])
    })
  })
})

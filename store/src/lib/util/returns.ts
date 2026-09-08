import { HttpTypes } from "@medusajs/types"

export type ItemWithDeliveryStatus = HttpTypes.StoreOrderLineItem & {
  deliveredQuantity: number
  returnableQuantity: number
  isDelivered: boolean
  isReturnable: boolean
}

/**
 * Calculates the exact quantity of an order item that is eligible for a return.
 * It subtracts already returned, requested, or written-off quantities from the total delivered.
 *
 * @param item - The order line item
 * @returns The quantity available for return
 */
export const calculateReturnableQuantity = (
  item: HttpTypes.StoreOrderLineItem
): number => {
  const deliveredQuantity = item.detail?.delivered_quantity || 0
  const returnRequestedQuantity = item.detail?.return_requested_quantity || 0
  const returnReceivedQuantity = item.detail?.return_received_quantity || 0
  const writtenOffQuantity = item.detail?.written_off_quantity || 0

  return Math.max(
    0,
    deliveredQuantity -
      returnRequestedQuantity -
      returnReceivedQuantity -
      writtenOffQuantity
  )
}

/**
 * Checks if at least one unit of the order item can be returned.
 *
 * @param item - The order line item
 * @returns True if the item is returnable, false otherwise
 */
export const isItemReturnable = (
  item: HttpTypes.StoreOrderLineItem
): boolean => {
  return calculateReturnableQuantity(item) > 0
}

/**
 * Extracts the delivery status and the latest shipment date from an order's fulfillments.
 *
 * @param order - The store order
 * @returns An object containing the shipping status and the latest shipment date (if shipped)
 */
export const getReturnDeliveryStatus = (
  order: HttpTypes.StoreOrder
): { isShipped: boolean; shipmentDate: Date | null } => {
  const fulfillments = (order as any).fulfillments || []
  const shipmentDates = fulfillments
    .map((f: any) => f.shipped_at)
    .filter(Boolean)
    .map((dateStr: string) => new Date(dateStr))

  if (shipmentDates.length > 0) {
    const latestDate = new Date(
      Math.max(...shipmentDates.map((d: Date) => d.getTime()))
    )
    return { isShipped: true, shipmentDate: latestDate }
  }

  return { isShipped: false, shipmentDate: null }
}

/**
 * Calculates the number of days remaining for a customer to initiate a return.
 *
 * @param order - The store order
 * @param returnDeadlineDays - The maximum allowed days for a return after shipment (defaults to 7)
 * @returns The number of days left to return, down to 0
 */
export const getReturnRemainingDays = (
  order: HttpTypes.StoreOrder,
  returnDeadlineDays: number = 7
): number => {
  const { isShipped, shipmentDate } = getReturnDeliveryStatus(order)
  if (!isShipped || !shipmentDate) {
    return returnDeadlineDays
  }

  const currentDate = new Date()
  const diffTime = currentDate.getTime() - shipmentDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  return Math.max(0, returnDeadlineDays - diffDays)
}

/**
 * Checks if an entire order has any items that can still be returned,
 * factoring in both the shipping date deadline and individual item quantities.
 *
 * @param order - The store order
 * @param returnDeadlineDays - The maximum allowed days for a return after shipment
 * @returns True if at least one item can be returned and the deadline hasn't passed
 */
export const hasReturnableItems = (
  order: HttpTypes.StoreOrder,
  returnDeadlineDays: number = 7
): boolean => {
  const { isShipped, shipmentDate } = getReturnDeliveryStatus(order)

  if (!isShipped || !shipmentDate) {
    return false
  }

  const currentDate = new Date()
  const diffTime = currentDate.getTime() - shipmentDate.getTime()
  const diffDays = diffTime / (1000 * 60 * 60 * 24)

  if (diffDays > returnDeadlineDays) {
    return false
  }

  return order.items?.some(isItemReturnable) || false
}

/**
 * Maps over an array of order items and enriches them with computed return statuses
 * such as delivered quantity and returnable quantity.
 *
 * @param items - Array of store order line items
 * @returns The enriched items array with ItemWithDeliveryStatus type
 */
export const enhanceItemsWithReturnStatus = (
  items: HttpTypes.StoreOrderLineItem[]
): ItemWithDeliveryStatus[] => {
  return items.map((item) => {
    const deliveredQuantity = item.detail?.delivered_quantity || 0
    const returnableQuantity = calculateReturnableQuantity(item)

    return {
      ...item,
      deliveredQuantity,
      returnableQuantity,
      isDelivered: deliveredQuantity > 0,
      isReturnable: returnableQuantity > 0,
    }
  })
}

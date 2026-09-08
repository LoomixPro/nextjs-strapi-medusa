"use client"

import { useTranslations } from "next-intl"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import React from "react"
import {
  hasReturnableItems,
  getReturnDeliveryStatus,
  getReturnRemainingDays,
  isItemReturnable,
} from "@lib/util/returns"

interface OrderDetailsTemplateProps {
  order: HttpTypes.StoreOrder
  returnDeadlineDays?: number
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
  returnDeadlineDays = 7,
}) => {
  const t = useTranslations("Account.Orders")
  const hasReturnableItemsInOrder = hasReturnableItems(
    order,
    returnDeadlineDays
  )

  const { isShipped } = getReturnDeliveryStatus(order)
  const remainingDays = getReturnRemainingDays(order, returnDeadlineDays)
  const canBeReturnedAtSomePoint = order.items?.some(isItemReturnable) ?? false

  return (
    <div className="flex flex-col justify-center gap-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-zinc-800/80 pb-5">
        <h1 className="text-lg font-bold sm:text-xl text-gray-900 dark:text-zinc-200">
          {t("details_title")}
        </h1>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          {hasReturnableItemsInOrder && (
            <LocalizedClientLink href={`/account/orders/return/${order.id}`}>
              <span className="inline-flex items-center justify-center h-10 px-5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl transition-all duration-200 shadow-sm shadow-blue-500/10 hover:shadow-blue-500/20 cursor-pointer shrink-0">
                {t("request_return")}
              </span>
            </LocalizedClientLink>
          )}
          <LocalizedClientLink
            href="/account/orders"
            data-testid="back-to-overview-button"
          >
            <span className="inline-flex items-center gap-2 h-10 px-4 text-xs font-semibold text-gray-700 dark:text-zinc-200 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/85 dark:hover:bg-zinc-700/80 border border-gray-200 dark:border-zinc-700 rounded-xl transition-all duration-200 cursor-pointer shrink-0">
              <XMark className="w-4 h-4 shrink-0 text-gray-400 dark:text-zinc-500" />
              {t("back_to_overview")}
            </span>
          </LocalizedClientLink>
        </div>
      </div>

      {canBeReturnedAtSomePoint && (
        <div className="flex items-center justify-between px-6 py-4 rounded-[24px] bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
          <span>
            {!isShipped
              ? t("return_waiting_delivery", { days: returnDeadlineDays })
              : remainingDays > 0
                ? t("return_remaining_days", { days: Math.ceil(remainingDays) })
                : t("return_expired")}
          </span>
        </div>
      )}
      <div
        className="flex flex-col gap-4 h-full bg-transparent w-full"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <Items order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <Help />
      </div>
    </div>
  )
}

export default OrderDetailsTemplate

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

const OrderDetailsStyle2: React.FC<OrderDetailsTemplateProps> = ({
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
    <div className="flex flex-col gap-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight mb-1">
            {t("details_title")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">
            Order #{order.display_id}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          {hasReturnableItemsInOrder && (
            <LocalizedClientLink href={`/account/orders/return/${order.id}`}>
              <span className="inline-flex items-center justify-center h-11 px-6 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-2xl transition-all duration-300 shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 cursor-pointer shrink-0">
                {t("request_return")}
              </span>
            </LocalizedClientLink>
          )}
          <LocalizedClientLink
            href="/account/orders"
            data-testid="back-to-overview-button"
          >
            <span className="inline-flex items-center gap-2 h-11 px-5 text-sm font-bold text-gray-700 dark:text-zinc-200 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-transparent dark:border-zinc-700 rounded-2xl transition-all duration-300 cursor-pointer shrink-0">
              <XMark className="w-5 h-5 shrink-0 text-gray-400 dark:text-zinc-400" />
              {t("back_to_overview")}
            </span>
          </LocalizedClientLink>
        </div>
      </div>

      {canBeReturnedAtSomePoint && (
        <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-semibold shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span>
              {!isShipped
                ? t("return_waiting_delivery", { days: returnDeadlineDays })
                : remainingDays > 0
                  ? t("return_remaining_days", {
                      days: Math.ceil(remainingDays),
                    })
                  : t("return_expired")}
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="bg-background rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
            <OrderDetails order={order} showStatus />
          </div>

          <div className="bg-background rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
            <h2 className="text-xl font-bold mb-6 text-foreground">
              Items Ordered
            </h2>
            <Items order={order} />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-background rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
            <OrderSummary order={order} />
          </div>

          <div className="bg-background rounded-3xl p-6 sm:p-8 shadow-sm border border-border">
            <ShippingDetails order={order} />
          </div>

          <div className="bg-muted rounded-3xl p-6 sm:p-8 border border-border">
            <Help />
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsStyle2

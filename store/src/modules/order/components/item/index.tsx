import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
}

const Item = ({ item, currencyCode }: ItemProps) => {
  const isOrderLineItem = "detail" in item
  const detail = isOrderLineItem ? (item as any).detail : null
  const returnReceived = detail?.return_received_quantity ?? 0
  const returnRequested = detail?.return_requested_quantity ?? 0
  const tOrder = useTranslations("Order.status")

  let badgeText = ""
  let badgeClass = ""

  if (returnReceived > 0) {
    if (returnReceived === item.quantity) {
      badgeText = tOrder("returned")
    } else {
      badgeText = tOrder("returned_pcs", { count: returnReceived })
    }
    badgeClass =
      "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
  } else if (returnRequested > 0) {
    if (returnRequested === item.quantity) {
      badgeText = tOrder("return_requested")
    } else {
      badgeText = tOrder("return_requested_pcs", { count: returnRequested })
    }
    badgeClass =
      "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
  }

  return (
    <div
      className="flex items-center justify-between py-5 gap-4 group/product"
      data-testid="product-row"
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border bg-muted/50 shrink-0 transition-all duration-300 group-hover/product:border-primary/20">
          <Thumbnail
            thumbnail={item.thumbnail}
            size="square"
            className="w-full h-full object-cover transition-transform duration-500 group-hover/product:scale-110"
          />
        </div>

        <div className="flex flex-col gap-1 text-left rtl:text-right">
          <Text
            className="text-sm font-semibold text-foreground leading-snug group-hover/product:text-primary transition-colors"
            data-testid="product-name"
          >
            {item.product_title}
          </Text>
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant"
          />
          {badgeText && (
            <span
              className={`w-fit mt-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${badgeClass}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end justify-center shrink-0 text-right">
        <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500 font-medium">
          <span
            data-testid="product-quantity"
            className="font-semibold text-gray-700 dark:text-zinc-300"
          >
            {item.quantity}
          </span>
          <span>×</span>
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>

        <div className="text-sm font-bold text-gray-900 dark:text-zinc-100 mt-0.5">
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </div>
      </div>
    </div>
  )
}

export default Item

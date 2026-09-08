import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useLocale, useTranslations } from "next-intl"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemUnitPriceProps) => {
  const isOrderLineItem = "detail" in item
  const detail = isOrderLineItem ? (item as any).detail : null
  const returnReceived = detail?.return_received_quantity ?? 0
  const returnRequested = detail?.return_requested_quantity ?? 0
  const isReturned = returnReceived > 0 || returnRequested > 0

  const quantity = item.quantity ?? 1
  const originalUnitPrice = item.unit_price ?? 0

  const total = isReturned ? originalUnitPrice * quantity : (item.total ?? 0)
  const original_total = isReturned
    ? originalUnitPrice * quantity
    : (item.original_total ?? 0)
  const hasReducedPrice = total < original_total
  const t = useTranslations("Common")
  const locale = useLocale()

  const percentage_diff =
    original_total > 0
      ? Math.round(((original_total - total) / original_total) * 100)
      : 0

  return (
    <div className="flex flex-col text-muted-foreground justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-muted-foreground">{t("original")}: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              {convertToLocale({
                amount: original_total / item.quantity,
                currency_code: currencyCode,
                locale,
              })}
            </span>
          </p>
          {style === "default" && (
            <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        {convertToLocale({
          amount: total / item.quantity,
          currency_code: currencyCode,
          locale,
        })}
      </span>
    </div>
  )
}

export default LineItemUnitPrice

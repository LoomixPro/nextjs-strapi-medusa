import { getPercentageDiff } from "@lib/util/get-percentage-diff"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { useLocale, useTranslations } from "next-intl"

type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemPrice = ({
  item,
  style = "default",
  currencyCode,
}: LineItemPriceProps) => {
  const isOrderLineItem = "detail" in item
  const detail = isOrderLineItem ? (item as any).detail : null
  const returnReceived = detail?.return_received_quantity ?? 0
  const returnRequested = detail?.return_requested_quantity ?? 0
  const isReturned = returnReceived > 0 || returnRequested > 0

  const quantity = item.quantity ?? 1
  const originalUnitPrice = item.unit_price ?? 0

  const currentPrice = isReturned
    ? originalUnitPrice * quantity
    : (item.total ?? 0)
  const originalPrice = isReturned
    ? originalUnitPrice * quantity
    : (item.original_total ?? 0)
  const hasReducedPrice = currentPrice < originalPrice
  const t = useTranslations("Common")
  const locale = useLocale()

  return (
    <div className="flex flex-col gap-x-2 text-muted-foreground items-end rtl:items-start">
      <div className="ltr:text-left rtl:text-right">
        {hasReducedPrice && (
          <>
            <p>
              {style === "default" && (
                <span className="text-muted-foreground">{t("original")}: </span>
              )}
              <span
                className="line-through text-muted-foreground"
                data-testid="product-original-price"
              >
                {convertToLocale({
                  amount: originalPrice,
                  currency_code: currencyCode,
                  locale,
                })}
              </span>
            </p>
            {style === "default" && (
              <span className="text-ui-fg-interactive">
                -{getPercentageDiff(originalPrice, currentPrice)}%
              </span>
            )}
          </>
        )}
        <span
          className={clx("text-base-regular", {
            "text-ui-fg-interactive": hasReducedPrice,
          })}
          data-testid="product-price"
        >
          {convertToLocale({
            amount: currentPrice,
            currency_code: currencyCode,
            locale,
          })}
        </span>
      </div>
    </div>
  )
}

export default LineItemPrice

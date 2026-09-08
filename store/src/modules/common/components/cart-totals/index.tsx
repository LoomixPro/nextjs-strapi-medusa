"use client"

import { convertToLocale } from "@lib/util/storefront-settings"
import { useLocale, useTranslations } from "next-intl"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const t = useTranslations("Common")
  const locale = useLocale()
  const {
    currency_code,
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div>
      <div className="flex flex-col gap-y-2 txt-medium text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>{t("subtotal")}</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            {convertToLocale({
              amount: item_subtotal ?? 0,
              currency_code,
              locale,
            })}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t("shipping")}</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            {convertToLocale({
              amount: shipping_subtotal ?? 0,
              currency_code,
              locale,
            })}
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>{t("discount")}</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              {convertToLocale({
                amount: discount_subtotal ?? 0,
                currency_code,
                locale,
              })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">{t("taxes")}</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            {convertToLocale({ amount: tax_total ?? 0, currency_code, locale })}
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-border my-4" />
      <div className="flex items-center justify-between text-foreground mb-2 txt-medium ">
        <span>{t("total")}</span>
        <span
          className="txt-xlarge-plus"
          data-testid="cart-total"
          data-value={total || 0}
        >
          {convertToLocale({ amount: total ?? 0, currency_code, locale })}
        </span>
      </div>
      <div className="h-px w-full border-b border-border mt-4" />
    </div>
  )
}

export default CartTotals

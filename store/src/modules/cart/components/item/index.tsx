"use client"

import { clx } from "@medusajs/ui"
import { updateLineItem } from "@lib/data/cart"
import { useCartRefresh } from "@lib/hooks/use-cart-refresh"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@/modules/checkout/templates/styles/style-1/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshCart = useCartRefresh()

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .then(() => {
        refreshCart()
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQtyFromInventory =
    item.variant?.manage_inventory && !item.variant?.allow_backorder
      ? item.variant?.inventory_quantity || 1
      : 10
  const maxQuantity = Math.max(item.quantity, maxQtyFromInventory)

  return (
    <tr
      className="w-full bg-transparent border-b border-border/60 hover:bg-muted/10 transition-colors"
      data-testid="product-row"
    >
      <td className="ltr:!pl-0 rtl:!pr-0 py-5 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </td>

      <td className="ltr:text-left rtl:text-right py-5 px-4 align-middle">
        <div className="flex flex-col">
          <span
            className="text-sm font-semibold text-foreground"
            data-testid="product-title"
          >
            {item.product_title}
          </span>
          <LineItemOptions
            variant={item.variant}
            data-testid="product-variant"
          />
        </div>
      </td>

      {type === "full" && (
        <td className="text-center py-5 px-4 align-middle">
          <div className="flex gap-2 items-center justify-center w-28 mx-auto">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-16 h-10"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}
            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </td>
      )}

      {type === "full" && (
        <td className="hidden small:table-cell text-center py-5 px-4 align-middle">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </td>
      )}

      <td className="ltr:!pr-0 rtl:!pl-0 text-center py-5 align-middle">
        <span
          className={clx("ltr:!pr-0 rtl:!pl-0", {
            "flex flex-col items-center h-full justify-center":
              type === "preview",
          })}
        >
          {type === "preview" && (
            <span className="flex gap-x-1 ">
              <span className="text-muted-foreground">{item.quantity}x </span>
              <LineItemUnitPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
          )}
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </td>
    </tr>
  )
}

export default Item

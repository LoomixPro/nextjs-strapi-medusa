"use client"

import { HttpTypes } from "@medusajs/types"
import { Badge, IconButton, Select, Textarea } from "@medusajs/ui"
import { Minus, Plus } from "@medusajs/icons"
import Thumbnail from "@modules/products/components/thumbnail"
import { convertToLocale } from "@lib/util/storefront-settings"
import { ItemWithDeliveryStatus } from "@lib/util/returns"
import { useTranslations } from "next-intl"

export type ReturnItemSelection = {
  id: string
  quantity: number
  return_reason_id?: string
  note?: string
}

type ReturnItemSelectorProps = {
  items: ItemWithDeliveryStatus[]
  returnReasons: HttpTypes.StoreReturnReason[]
  onItemSelectionChange: (item: ReturnItemSelection) => void
  selectedItems: ReturnItemSelection[]
  currencyCode: string
}

const ReturnItemSelector: React.FC<ReturnItemSelectorProps> = ({
  items,
  returnReasons,
  onItemSelectionChange,
  selectedItems,
  currencyCode,
}) => {
  const t = useTranslations("Account.Orders")
  const handleQuantityChange = ({
    item_id,
    quantity,
    selected_item,
  }: {
    item_id: string
    quantity: number
    selected_item?: ReturnItemSelection
  }) => {
    const item = items.find((i) => i.id === item_id)
    if (!item || !item.isReturnable) {
      return
    }

    const maxQuantity = item.returnableQuantity
    const newQuantity = Math.max(0, Math.min(quantity, maxQuantity))

    onItemSelectionChange({
      id: item_id,
      quantity: newQuantity,
      return_reason_id: selected_item?.return_reason_id || "",
      note: selected_item?.note || "",
    })
  }

  const handleReturnReasonChange = ({
    item_id,
    return_reason_id,
    selected_item,
  }: {
    item_id: string
    return_reason_id: string
    selected_item?: ReturnItemSelection
  }) => {
    onItemSelectionChange({
      id: item_id,
      quantity: selected_item?.quantity || 0,
      return_reason_id,
      note: selected_item?.note || "",
    })
  }

  const handleNoteChange = ({
    item_id,
    note,
    selected_item,
  }: {
    item_id: string
    note: string
    selected_item?: ReturnItemSelection
  }) => {
    onItemSelectionChange({
      id: item_id,
      quantity: selected_item?.quantity || 0,
      return_reason_id: selected_item?.return_reason_id || "",
      note,
    })
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const itemSelection = selectedItems.find((si) => si.id === item.id)
        const currentQuantity = itemSelection?.quantity || 0
        const currentReturnReason = itemSelection?.return_reason_id || ""
        const currentNote = itemSelection?.note || ""

        return (
          <div
            key={item.id}
            className={`p-4 border rounded-lg ${
              !item.isReturnable ? "opacity-60 bg-muted" : ""
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex w-16">
                  <Thumbnail
                    thumbnail={item.thumbnail}
                    images={[]}
                    size="square"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="txt-medium truncate">{item.title}</h4>
                  {!item.isReturnable && (
                    // @ts-ignore
                    <Badge color="grey" size="small">
                      {!item.isDelivered
                        ? t("not_delivered")
                        : t("not_returnable")}
                    </Badge>
                  )}
                </div>
                {item.variant && (
                  <p className="txt-small text-ui-fg-subtle">
                    {item.variant.title}
                  </p>
                )}
                <p className="txt-small text-ui-fg-subtle">
                  {item.isReturnable
                    ? t("available_to_return", {
                        count: item.returnableQuantity,
                      })
                    : item.isDelivered
                      ? t("delivered_processed", {
                          count: item.deliveredQuantity,
                          total: item.quantity,
                        })
                      : t("delivered_zero", { total: item.quantity })}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="txt-small">
                  {convertToLocale({
                    amount: item.unit_price,
                    currency_code: currencyCode,
                  })}
                </span>

                {item.isReturnable ? (
                  <div className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleQuantityChange({
                          item_id: item.id,
                          quantity: currentQuantity - 1,
                          selected_item: itemSelection,
                        })
                      }
                      disabled={currentQuantity <= 0}
                    >
                      <Minus />
                    </IconButton>

                    <span className="w-8 text-center txt-small">
                      {currentQuantity}
                    </span>

                    {/* @ts-ignore */}
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleQuantityChange({
                          item_id: item.id,
                          quantity: currentQuantity + 1,
                          selected_item: itemSelection,
                        })
                      }
                      disabled={currentQuantity >= item.returnableQuantity}
                    >
                      <Plus />
                    </IconButton>
                  </div>
                ) : (
                  <div className="txt-small text-ui-fg-subtle">
                    {t("not_available")}
                  </div>
                )}
              </div>
            </div>

            {item.isReturnable && currentQuantity > 0 && (
              <div className="mt-4 pt-4 border-t border-ui-border-base space-y-3">
                <div>
                  <label className="block txt-small-plus mb-2">
                    {t("return_reason_label")}
                  </label>
                  <Select
                    value={currentReturnReason}
                    onValueChange={(value) =>
                      handleReturnReasonChange({
                        item_id: item.id,
                        return_reason_id: value,
                        selected_item: itemSelection,
                      })
                    }
                  >
                    <Select.Trigger>
                      <Select.Value
                        placeholder={t("select_reason_placeholder")}
                      />
                    </Select.Trigger>
                    <Select.Content>
                      {returnReasons.map((reason) => (
                        <Select.Item key={reason.id} value={reason.id}>
                          {reason.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select>
                </div>

                <div>
                  <label className="block txt-small-plus mb-2">
                    {t("additional_note_label")}
                  </label>
                  <Textarea
                    value={currentNote}
                    onChange={(e) =>
                      handleNoteChange({
                        item_id: item.id,
                        note: e.target.value,
                        selected_item: itemSelection,
                      })
                    }
                    placeholder={t("note_placeholder")}
                    rows={2}
                    maxLength={500}
                  />
                  <p className="txt-xsmall text-ui-fg-subtle mt-1">
                    {t("char_count", { count: currentNote.length })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="txt-medium-plus mb-2">{t("selected_summary")}</h4>
          <div className="space-y-3">
            {selectedItems.map((selectedItem) => {
              const item = items.find((i) => i.id === selectedItem.id)
              if (!item) {
                return null
              }

              const returnReason = returnReasons.find(
                (r) => r.id === selectedItem.return_reason_id
              )

              return (
                <div
                  key={selectedItem.id}
                  className="border-b border-border pb-2 last:border-b-0"
                >
                  <div className="flex justify-between txt-small mb-1">
                    <span>
                      {item.title} x {selectedItem.quantity}
                    </span>
                    <span>
                      {convertToLocale({
                        amount: item.unit_price * selectedItem.quantity,
                        currency_code: currencyCode,
                      })}
                    </span>
                  </div>
                  {returnReason && (
                    <p className="txt-xsmall text-ui-fg-subtle">
                      {t("reason_label", { label: returnReason.label })}
                    </p>
                  )}
                  {selectedItem.note && (
                    <p className="txt-xsmall text-ui-fg-subtle">
                      {t("note_label", { note: selectedItem.note })}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default ReturnItemSelector

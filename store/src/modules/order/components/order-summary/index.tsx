import { useTranslations } from "next-intl"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { Receipt } from "lucide-react"

interface OrderSummaryProps {
  order: HttpTypes.StoreOrder
}

const OrderSummary = ({ order }: OrderSummaryProps) => {
  const t = useTranslations("Order")

  const getAmount = (amount?: number | null) => {
    if (!amount && amount !== 0) {
      return "-"
    }

    return convertToLocale({
      amount,
      currency_code: order.currency_code ?? "",
    })
  }

  return (
    <div className="bg-background border border-border p-6 sm:p-8 rounded-[32px] shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
          <Receipt size={18} />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {t("summary")}
        </h3>
      </div>

      {/* Breakdown list */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-zinc-400 font-medium">
            {t("subtotal")}
          </span>
          <span className="text-gray-800 dark:text-zinc-200 font-semibold">
            {getAmount(order.subtotal)}
          </span>
        </div>

        {order.discount_total > 0 && (
          <div className="flex items-center justify-between text-sm bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {t("discount")}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              - {getAmount(order.discount_total)}
            </span>
          </div>
        )}

        {order.gift_card_total > 0 && (
          <div className="flex items-center justify-between text-sm bg-emerald-50/50 dark:bg-emerald-950/10 px-3 py-2 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              {t("discount")}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              - {getAmount(order.gift_card_total)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-zinc-400 font-medium">
            {t("shipping")}
          </span>
          <span className="text-gray-800 dark:text-zinc-200 font-semibold">
            {getAmount(order.shipping_total)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-zinc-400 font-medium">
            {t("tax")}
          </span>
          <span className="text-gray-800 dark:text-zinc-200 font-semibold">
            {getAmount(order.tax_total)}
          </span>
        </div>

        {/* Separator line */}
        <div className="h-px w-full border-b border-gray-100 dark:border-zinc-800 border-dashed my-4" />

        {/* Total Price */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-base font-bold text-foreground">
            {t("total")}
          </span>
          <span className="text-lg font-black text-primary tracking-tight">
            {getAmount(order.total)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default OrderSummary

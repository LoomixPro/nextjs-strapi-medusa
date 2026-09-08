import { useTranslations } from "next-intl"
import { CreditCard } from "lucide-react"

import { isStripeLike, paymentInfoMap } from "@lib/constants"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { toJalaliDateTime } from "@lib/util/date"

interface PaymentDetailsProps {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const t = useTranslations("Order")
  const payment = order.payment_collections?.[0]?.payments?.[0]

  if (!payment) return null

  const paymentInfo = paymentInfoMap[payment.provider_id] || {
    title: payment.provider_id,
    icon: <CreditCard size={24} />,
  }

  return (
    <div className="bg-background border border-border p-6 sm:p-8 rounded-[32px] shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
          <CreditCard size={18} />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          {t("payment")}
        </h3>
      </div>

      <div className="flex flex-col gap-5">
        <div className="bg-gray-50/30 dark:bg-zinc-800/25 border border-gray-100/50 dark:border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-2.5">
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
            {t("payment_method")}
          </div>
          <div
            className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-relaxed"
            data-testid="payment-method"
          >
            {paymentInfo.title}
          </div>
        </div>

        <div className="bg-gray-50/30 dark:bg-zinc-800/25 border border-gray-100/50 dark:border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-2.5">
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
            {t("payment_details")}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 flex items-center justify-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded shadow-sm shrink-0 overflow-hidden [&_svg]:w-full [&_svg]:h-full [&_svg]:object-contain">
              {paymentInfo.icon}
            </div>
            <div className="flex flex-col">
              <span
                className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-relaxed"
                data-testid="payment-amount"
              >
                {isStripeLike(payment.provider_id) && payment.data?.card_last4
                  ? `**** **** **** ${String(payment.data.card_last4)}`
                  : convertToLocale({
                      amount: payment.amount,
                      currency_code: order.currency_code,
                    })}
              </span>
              {!isStripeLike(payment.provider_id) && (
                <span className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  {toJalaliDateTime(payment.created_at)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentDetails

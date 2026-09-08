import { HttpTypes } from "@medusajs/types"
import { Text } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { toJalali } from "@lib/util/date"
import { formatPhoneOrEmail } from "@lib/util/phone"
import {
  ClipboardList,
  CreditCard,
  Package,
  Truck,
  CheckCircle2,
  Mail,
  AlertCircle,
} from "lucide-react"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const t = useTranslations("Order")
  const tStatus = useTranslations("Statuses")

  const fStatus = order.fulfillment_status?.toLowerCase()
  const pStatus = order.payment_status?.toLowerCase()
  const isCanceled =
    order.status?.toLowerCase() === "canceled" || fStatus === "canceled"

  // Calculate the active step in the order timeline
  let activeStepIndex = 0
  if (fStatus === "delivered") activeStepIndex = 4
  else if (fStatus === "shipped" || fStatus === "partially_shipped")
    activeStepIndex = 3
  else if (
    fStatus === "fulfilled" ||
    fStatus === "partially_fulfilled" ||
    order.status?.toLowerCase() === "pending" ||
    order.status?.toLowerCase() === "processing"
  )
    activeStepIndex = 2
  else if (pStatus === "captured" || pStatus === "authorized")
    activeStepIndex = 1

  const stepLabels = [
    t("details.placed"),
    tStatus.has("captured") ? tStatus("captured") : t("details.paid"),
    tStatus.has("processing") ? tStatus("processing") : t("details.processing"),
    tStatus.has("shipped") ? tStatus("shipped") : t("details.shipped"),
    tStatus.has("delivered") ? tStatus("delivered") : t("details.delivered"),
  ]

  const stepIcons = [ClipboardList, CreditCard, Package, Truck, CheckCircle2]

  return (
    <div className="bg-background border border-border p-6 sm:p-8 rounded-[32px] shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Top Details Section */}
      <div className="flex flex-wrap justify-between items-start md:items-center gap-6">
        <div className="flex items-start gap-3.5 flex-1 min-w-[240px]">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl shrink-0">
            <Mail size={20} />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
              {t("details.order_confirmation")}
            </span>
            <Text className="text-sm font-semibold text-gray-800 dark:text-zinc-200 leading-tight">
              {t.rich("confirmation_sent", {
                email: formatPhoneOrEmail(order.email) ?? "",
                email_tag: (children) => (
                  <span
                    className="text-primary font-bold inline-block"
                    dir="ltr"
                    data-testid="order-email"
                  >
                    {children}
                  </span>
                ),
              })}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 w-full sm:w-auto">
          <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-100/50 dark:border-zinc-800 p-3 rounded-2xl flex flex-col gap-1 min-w-[100px] sm:min-w-[120px]">
            <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
              {t("number")}
            </span>
            <span
              className="text-sm font-bold text-gray-900 dark:text-zinc-100"
              data-testid="order-id"
            >
              #{order.display_id ?? ""}
            </span>
          </div>
          <div className="bg-gray-50/50 dark:bg-zinc-800/30 border border-gray-100/50 dark:border-zinc-800 p-3 rounded-2xl flex flex-col gap-1 min-w-[100px] sm:min-w-[120px]">
            <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider">
              {t("date")}
            </span>
            <span
              className="text-sm font-semibold text-gray-900 dark:text-zinc-100"
              data-testid="order-date"
            >
              {toJalali(order.created_at)}
            </span>
          </div>
        </div>
      </div>

      {isCanceled ? (
        <div className="mt-8 p-4 bg-red-50/60 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle size={20} className="shrink-0" />
          <div className="text-xs font-semibold">
            {t("details.order_canceled")}
          </div>
        </div>
      ) : (
        showStatus && (
          <>
            <div className="h-px w-full border-b border-dashed border-gray-100 dark:border-zinc-800 my-8" />

            {/* Visual Timeline Section */}
            <div className="relative w-full py-4 mt-2">
              {/* Timeline background track */}
              <div className="absolute top-8 sm:top-9 left-[10%] right-[10%] h-[3px] bg-gray-100 dark:bg-zinc-800 -translate-y-1/2 z-0 rounded-full" />

              {/* Timeline active fill */}
              <div
                className="absolute top-8 sm:top-9 h-[3px] bg-primary -translate-y-1/2 z-0 rounded-full transition-all duration-700 ltr:left-[10%] rtl:right-[10%] ltr:origin-left rtl:origin-right"
                style={{
                  width: `${(activeStepIndex / 4) * 80}%`,
                }}
              />

              {/* Steps grid */}
              <div className="relative z-10 flex justify-between items-center w-full">
                {stepLabels.map((label, idx) => {
                  const isActive = idx <= activeStepIndex
                  const isCurrent = idx === activeStepIndex
                  const StepIcon = stepIcons[idx]

                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center gap-2.5 w-1/5"
                    >
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all duration-500 ${
                          isActive
                            ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/15"
                            : "bg-background border-border text-muted-foreground"
                        } ${
                          isCurrent ? "ring-4 ring-primary/20 scale-105" : ""
                        }`}
                      >
                        <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <span
                        className={`text-[9px] sm:text-xs font-semibold text-center truncate max-w-full px-1 transition-colors duration-300 ${
                          isActive
                            ? "text-gray-950 dark:text-zinc-100 font-bold"
                            : "text-gray-400 dark:text-zinc-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

export default OrderDetails

import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { useTranslations } from "next-intl"
import {
  Truck,
  MapPin,
  Phone,
  Milestone,
  ExternalLink,
  Search,
} from "lucide-react"
import { formatPhoneOrEmail } from "@lib/util/phone"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  const t = useTranslations("Order")

  const fulfillments = (order as any).fulfillments || []
  const trackingLabels = fulfillments.flatMap((f: any) => f.labels || [])

  return (
    <div className="bg-background border border-border p-6 sm:p-8 rounded-[32px] shadow-xs hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Header section */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="p-2 bg-primary/10 text-primary rounded-xl shrink-0">
          <Truck size={18} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100">
          {t("delivery")}
        </h3>
      </div>

      {/* Stack container for shipping address, contact, method, and tracking info */}
      <div className="flex flex-col gap-5">
        {/* Shipping Address */}
        <div
          className="bg-gray-50/30 dark:bg-zinc-800/25 border border-gray-100/50 dark:border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-2.5"
          data-testid="shipping-address-summary"
        >
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <MapPin size={13} className="text-gray-400 dark:text-zinc-500" />
            {t("shipping_address")}
          </div>
          <div className="flex flex-col text-sm font-medium text-gray-700 dark:text-zinc-300 leading-relaxed">
            <span>
              {order.shipping_address?.first_name}{" "}
              {order.shipping_address?.last_name}
            </span>
            <span>
              {order.shipping_address?.address_1}{" "}
              {order.shipping_address?.address_2}
            </span>
            <span>
              {order.shipping_address?.postal_code},{" "}
              {order.shipping_address?.city}
            </span>
            <span className="uppercase text-[11px] text-gray-450 dark:text-zinc-500 font-semibold mt-1">
              {order.shipping_address?.country_code?.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Contact info */}
        <div
          className="bg-gray-50/30 dark:bg-zinc-800/25 border border-gray-100/50 dark:border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-2.5"
          data-testid="shipping-contact-summary"
        >
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <Phone size={13} className="text-gray-400 dark:text-zinc-500" />
            {t("contact")}
          </div>
          <div className="flex flex-col text-sm font-medium text-gray-700 dark:text-zinc-300 leading-relaxed">
            <span className="font-mono text-xs inline-block" dir="ltr">
              {order.shipping_address?.phone}
            </span>
            <span className="truncate text-xs text-primary mt-0.5">
              {formatPhoneOrEmail(order.email)}
            </span>
          </div>
        </div>

        {/* Shipping Method */}
        <div
          className="bg-gray-50/30 dark:bg-zinc-800/25 border border-gray-100/50 dark:border-zinc-800/50 p-5 rounded-2xl flex flex-col gap-2.5"
          data-testid="shipping-method-summary"
        >
          <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
            <Milestone size={13} className="text-gray-400 dark:text-zinc-500" />
            {t("method")}
          </div>
          <div className="text-sm font-semibold text-foreground leading-relaxed">
            {(order as any).shipping_methods?.[0]?.name}
            <span className="block text-xs font-semibold text-primary mt-1 bg-primary/10 px-2.5 py-1 rounded-lg w-max">
              {convertToLocale({
                amount: order.shipping_methods?.[0]?.total ?? 0,
                currency_code: order.currency_code ?? "",
              })}
            </span>
          </div>
        </div>

        {/* Tracking info (rendered alongside the rest if it exists) */}
        {trackingLabels.map((label: any, idx: number) => {
          let trackingUrl = label.tracking_url || ""

          if (trackingUrl && !/^https?:\/\//i.test(trackingUrl)) {
            trackingUrl = `https://${trackingUrl}`
          }

          const labelText =
            trackingLabels.length > 1
              ? `${t("tracking_info")} (${t("package_number", {
                  number: idx + 1,
                })})`
              : t("tracking_info")

          return (
            <div
              key={idx}
              className="bg-muted/30 border border-border p-5 rounded-2xl flex flex-col gap-2.5 hover:border-primary/50 transition-all duration-300"
              data-testid="shipping-tracking-summary"
            >
              <div className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500 tracking-wider flex items-center gap-1.5">
                <Search
                  size={13}
                  className="text-gray-400 dark:text-zinc-500"
                />
                {labelText}
              </div>
              <div className="text-sm font-semibold text-gray-850 dark:text-zinc-200 leading-relaxed">
                <span className="font-mono block select-all tracking-wide text-gray-900 dark:text-zinc-100">
                  {label.tracking_number}
                </span>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mt-2 bg-primary/10 px-2.5 py-1 rounded-lg hover:bg-primary/20 transition-colors w-max"
                  >
                    <ExternalLink size={12} />
                    {t("track_shipment")}
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ShippingDetails

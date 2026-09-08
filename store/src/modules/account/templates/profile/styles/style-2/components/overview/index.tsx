import { clx } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import { User, MapPin, Package, Clock, ArrowUpRight } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/storefront-settings"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/shadcn/button"
import { toJalali } from "@lib/util/date"
import { formatPhoneOrEmail } from "@lib/util/phone"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const StatCard = ({
  icon: Icon,
  title,
  subtitle,
  value,
  href,
}: {
  icon: any
  title: string
  subtitle: string
  value: string | number | null
  href: string
}) => (
  <LocalizedClientLink href={href} className="flex-1">
    <div className="group bg-background/40 backdrop-blur-3xl border border-border/50 p-6 rounded-[32px] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/5 transition-all duration-300 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-muted/60 shadow-inner rounded-2xl group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors">
          <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-muted-foreground/70 group-hover:text-primary/70 transition-colors" />
      </div>
      <div>
        <h3 className="text-muted-foreground text-[10px] font-medium uppercase tracking-[0.15em] mb-1">
          {title}
        </h3>
        <div className="flex items-baseline gap-2">
          {value !== null && (
            <span className="text-2xl font-medium text-foreground">
              {value}
            </span>
          )}
          <span className="text-muted-foreground text-xs font-normal">
            {subtitle}
          </span>
        </div>
      </div>
    </div>
  </LocalizedClientLink>
)

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
    <div
      className="h-full bg-primary transition-all duration-1000 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
)

const Overview = ({ customer, orders }: OverviewProps) => {
  const t = useTranslations("Account.Overview")
  const tNav = useTranslations("Account.Nav")
  const tStatus = useTranslations("Statuses")
  const completion = getProfileCompletion(customer)

  const getStatusDetails = (order: HttpTypes.StoreOrder) => {
    const statusVal = order.fulfillment_status ?? order.status
    const key = statusVal?.toLowerCase()
    let label: string = statusVal ?? ""
    if (key && tStatus.has(key)) {
      label = tStatus(key as any)
    } else {
      const formatted = statusVal ? statusVal.split("_").join(" ") : ""
      label = formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
    }

    let dotColorClass = "bg-blue-500"
    if (
      key === "not_fulfilled" ||
      key === "pending" ||
      key === "requires_action" ||
      key === "processing"
    ) {
      dotColorClass = "bg-amber-500"
    } else if (key === "delivered") {
      dotColorClass = "bg-emerald-500"
    } else if (
      key === "canceled" ||
      key === "cancelled" ||
      key === "returned" ||
      key === "partially_returned"
    ) {
      dotColorClass = "bg-red-500"
    }

    return { label, dotColorClass }
  }

  return (
    <div
      className="max-w-5xl mx-auto space-y-8"
      data-testid="overview-page-wrapper"
    >
      {/* Header Section */}
      <div className="relative overflow-hidden bg-background/40 backdrop-blur-3xl border border-border/50 p-8 rounded-[40px] group shadow-[0_8px_32px_rgba(31,38,135,0.05)]">
        <div className="absolute top-0 end-0 -mt-16 -me-16 w-80 h-80 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1
              className="text-2xl font-medium text-foreground tracking-tight"
              data-testid="welcome-message"
            >
              {(() => {
                const fName = customer?.first_name
                const lName = customer?.last_name
                const hasRealName =
                  fName && fName !== "null" && fName !== "undefined"
                const username = customer?.metadata?.username as string
                const isGeneratedUser = username && username.startsWith("user_")

                let displayName = t("dear_user") // Default fallback
                if (hasRealName) {
                  displayName = `${fName} ${
                    lName && lName !== "null" && lName !== "undefined"
                      ? lName
                      : ""
                  }`.trim()
                } else if (username && !isGeneratedUser) {
                  displayName = username
                }

                return t("welcome_back", { name: displayName })
              })()}
            </h1>
            <p className="text-sm text-muted-foreground font-light">
              {t("signed_in_as")}{" "}
              <span
                className="text-primary font-medium"
                dir="ltr"
                data-testid="customer-email"
              >
                {formatPhoneOrEmail(customer?.email, customer?.phone)}
              </span>
            </p>
          </div>

          <div className="bg-muted/50 backdrop-blur-md p-5 rounded-[24px] border border-border/60 min-w-[220px] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {tNav("profile")}
              </span>
              <span className="text-xs font-black text-primary">
                {completion}%
              </span>
            </div>
            <ProgressBar progress={completion} />
            <p className="text-[10px] text-muted-foreground mt-3 font-medium uppercase tracking-widest">
              {completion === 100
                ? t("profile_completed")
                : t("complete_your_profile")}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={User}
          title={tNav("profile")}
          value={null}
          subtitle={t("manage_account_short")}
          href="/account/profile"
        />
        <StatCard
          icon={MapPin}
          title={tNav("addresses")}
          value={customer?.addresses?.length || 0}
          subtitle={t("saved")}
          href="/account/addresses"
        />
      </div>

      {/* Recent Orders Section */}
      <div className="bg-background/40 backdrop-blur-3xl border border-border/50 rounded-[40px] overflow-hidden shadow-[0_8px_32px_rgba(31,38,135,0.05)]">
        <div className="px-8 py-6 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-primary rounded-xl shadow-md shadow-primary/10">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              {t("recent_orders")}
            </h2>
          </div>
          <LocalizedClientLink href="/account/orders">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] h-10 px-4 text-primary hover:text-primary/80 hover:bg-primary/5 transition-colors"
            >
              {tNav("orders")}
            </Button>
          </LocalizedClientLink>
        </div>

        <div className="divide-y divide-border/50 px-4 md:px-8 pb-4">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => (
              <LocalizedClientLink
                key={order.id}
                href={`/account/orders/details/${order.id}`}
                className="group flex flex-col md:flex-row md:items-center justify-between py-6 gap-4 hover:bg-muted/40 rounded-2xl transition-all px-4 -mx-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-muted/60 shadow-sm rounded-2xl flex items-center justify-center group-hover:bg-primary/5 dark:group-hover:bg-primary/10 transition-colors border border-border">
                    <Clock className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-0.5">
                      #{order.display_id}
                    </p>
                    <p className="text-xs text-muted-foreground font-light tracking-wide">
                      {toJalali(order.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-8">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground mb-0.5">
                      {convertToLocale({
                        amount: order.total ?? 0,
                        currency_code: order.currency_code ?? "",
                      })}
                    </p>
                    {(() => {
                      const { label, dotColorClass } = getStatusDetails(order)
                      return (
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1 justify-end">
                          <span
                            className={clx(
                              "w-1.5 h-1.5 rounded-full",
                              dotColorClass
                            )}
                          />
                          {label}
                        </p>
                      )
                    })()}
                  </div>
                  <div className="p-2 border border-border rounded-xl group-hover:bg-accent transition-colors">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                  </div>
                </div>
              </LocalizedClientLink>
            ))
          ) : (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium text-sm">
                {t("no_orders")}
              </p>
              <LocalizedClientLink href="/store" className="mt-4 inline-block">
                <span className="text-primary font-medium text-xs hover:underline">
                  {t("continue_shopping")}
                </span>
              </LocalizedClientLink>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview

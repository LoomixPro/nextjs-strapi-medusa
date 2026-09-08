import { useTranslations } from "next-intl"
import { ShoppingBag } from "lucide-react"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/shadcn/button"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  const t = useTranslations("Account.Orders")

  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-6 w-full pb-12">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center justify-center min-h-[350px] gap-y-4 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl rounded-[32px] border border-white/50 dark:border-white/10 shadow-[0_8px_32px_rgba(31,38,135,0.05)] hover:shadow-lg hover:border-primary/20 p-8 transition-all duration-500"
      data-testid="no-orders-container"
    >
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-primary mb-2 group hover:scale-110 transition-transform duration-300">
        <ShoppingBag size={28} className="stroke-[1.5]" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          {t("no_orders_title")}
        </h2>
        <p className="text-xs text-muted-foreground max-w-[280px] mx-auto font-light leading-relaxed">
          {t("no_orders_description")}
        </p>
      </div>
      <div className="mt-4">
        <LocalizedClientLink href="/" passHref>
          <Button
            data-testid="continue-shopping-button"
            className="rounded-2xl h-10 px-6 text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/10 transition-all border-none"
          >
            {t("continue_shopping")}
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview

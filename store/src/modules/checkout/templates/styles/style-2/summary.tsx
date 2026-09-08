import { Heading } from "@medusajs/ui"
import { useTranslations } from "next-intl"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@/modules/checkout/templates/styles/style-2/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"

const CheckoutSummaryStyle2 = ({ cart }: { cart: any }) => {
  const t = useTranslations("Checkout")

  return (
    <div className="sticky top-[120px] flex flex-col-reverse small:flex-col gap-y-8 py-8 small:py-0">
      <div className="w-full flex flex-col bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl px-8 py-8 rounded-[32px] border border-white/50 dark:border-zinc-800/50 shadow-xl shadow-indigo-500/5">
        <Divider className="mb-6 small:hidden" />
        <Heading
          level="h2"
          className="flex flex-row text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-100"
        >
          {t("in_your_cart")}
        </Heading>
        <Divider className="my-6 border-white/40 dark:border-zinc-800/50" />
        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl p-6 border border-white/50 dark:border-zinc-800/50 mb-6">
          <CartTotals totals={cart} />
        </div>
        <div className="bg-white/60 dark:bg-zinc-900/60 rounded-2xl p-6 border border-white/50 dark:border-zinc-800/50">
          <ItemsPreviewTemplate cart={cart} />
        </div>
        <div className="mt-6">
          <DiscountCode cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CheckoutSummaryStyle2

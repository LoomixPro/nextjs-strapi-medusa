import { readCookie } from "@lib/util/safe-cookies"
import { getTranslations } from "next-intl/server"
import { CheckCircle2 } from "lucide-react"

import OrderSummary from "@modules/order/components/order-summary"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import PurchaseEvent from "@modules/order/components/purchase-event"
import { HttpTypes } from "@medusajs/types"

interface OrderCompletedTemplateProps {
  order: HttpTypes.StoreOrder
}

/**
 * Guide for creating a new Order Completed Template style
 *
 * This component acts as the layout structure for the "Order Confirmation" / "Thank You" page.
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props - `OrderCompletedTemplateProps`):
 *    - `order`: The completed order object (`HttpTypes.StoreOrder`). This contains everything
 *      needed for the receipt (items, totals, shipping address, payment status).
 *
 * 2. Component Structure:
 *    - Success Message: Typically a prominent header or icon thanking the user for their purchase.
 *    - Order Details (`OrderDetails`): Displays the order ID, date, and general status.
 *    - Items List (`Items`): Shows exactly what the user purchased.
 *    - Order Summary (`OrderSummary`): Shows the breakdown of subtotal, taxes, shipping, and total.
 *    - Shipping & Payment (`ShippingDetails`, `PaymentDetails`): Where it's going and how it was paid.
 *    - Support (`Help`): Contact info or links for order issues.
 *
 * 3. Special Tracking/Events:
 *    - `PurchaseEvent`: Used for analytics (like Google Analytics or Facebook Pixel).
 *      Make sure to include this invisible component in your new style so conversions are tracked.
 *    - Onboarding CTA (`OnboardingCta`): Specifically used if `_medusa_onboarding` is active in cookies.
 *
 * 4. Final Output (Return):
 *    Your component should return a responsive JSX wrapper acting as a digital receipt.
 *    Ensure it looks good on mobile, as many users check out via phone.
 */
export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const onboardingCookie = await readCookie("_medusa_onboarding")
  const t = await getTranslations("Order")

  const isOnboarding = onboardingCookie === "true"

  return (
    <div className="py-10 min-h-[calc(100vh-64px)]">
      <PurchaseEvent order={order} />
      <div className="content-container flex flex-col justify-center items-center max-w-4xl h-full w-full mx-auto">
        {isOnboarding && (
          <div className="w-full mb-8">
            <OnboardingCta orderId={order.id} />
          </div>
        )}

        <div
          className="flex flex-col gap-6 h-full bg-transparent w-full"
          data-testid="order-complete-container"
        >
          <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-[32px] flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 size={36} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {t("thank_you")}
              </h1>
              <p className="text-base text-gray-500 dark:text-zinc-400 font-medium">
                {t("order_placed_successfully")}
              </p>
            </div>
          </div>

          <OrderDetails order={order} />
          <Items order={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <OrderSummary order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}

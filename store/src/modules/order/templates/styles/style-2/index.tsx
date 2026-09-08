import { readCookie } from "@lib/util/safe-cookies"
import { getTranslations } from "next-intl/server"
import { CheckCircle2, Package, Receipt, Sparkles } from "lucide-react"

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

export default async function OrderCompletedStyle2({
  order,
}: OrderCompletedTemplateProps) {
  const onboardingCookie = await readCookie("_medusa_onboarding")
  const t = await getTranslations("Order")

  const isOnboarding = onboardingCookie === "true"

  return (
    <div className="min-h-screen bg-background pb-24 font-sans text-foreground selection:bg-primary/30">
      <PurchaseEvent order={order} />

      {/* Hero Section */}
      <div className="relative pt-24 pb-16 overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/40 rounded-full blur-3xl animate-pulse mix-blend-screen"></div>
          <div
            className="absolute top-1/3 right-1/4 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse mix-blend-screen"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-in fade-in zoom-in duration-1000"></div>
            <div className="w-20 h-20 bg-background/80 backdrop-blur-xl border border-border rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-primary/10 relative z-10">
              <CheckCircle2 size={40} strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 text-foreground">
            {t("thank_you")}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-lg">
            {t("order_placed_successfully")}
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-muted/50 border border-border shadow-sm text-sm font-semibold tracking-wide text-foreground">
            Order #{order.display_id}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 relative z-20">
        {isOnboarding && (
          <div className="w-full mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <OnboardingCta orderId={order.id} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {/* Left Column: Order Details & Items */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="bg-background/50 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-border/50 border border-border transition-all duration-300 hover:shadow-primary/5">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                <div className="p-2.5 rounded-xl bg-muted/50 text-foreground">
                  <Receipt size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Order Information
                </h2>
              </div>
              <OrderDetails order={order} />
            </section>

            <section className="bg-background/50 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-border/50 border border-border">
              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
                <div className="p-2.5 rounded-xl bg-muted/50 text-foreground">
                  <Package size={24} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Items Ordered
                </h2>
              </div>
              <Items order={order} />
            </section>
          </div>

          {/* Right Column: Summary & Shipping/Payment */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="bg-card rounded-[2.5rem] p-8 shadow-2xl shadow-border/50 border border-border text-card-foreground relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none"></div>
              <h2 className="text-xl font-bold tracking-tight mb-6">
                Order Summary
              </h2>
              <div className="relative z-10 text-card-foreground">
                <OrderSummary order={order} />
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
              <section className="bg-background/50 backdrop-blur-xl rounded-[2rem] p-7 shadow-xl shadow-border/50 border border-border">
                <ShippingDetails order={order} />
              </section>

              <section className="bg-background/50 backdrop-blur-xl rounded-[2rem] p-7 shadow-xl shadow-border/50 border border-border">
                <PaymentDetails order={order} />
              </section>
            </div>

            <section className="mt-4 px-2">
              <Help />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

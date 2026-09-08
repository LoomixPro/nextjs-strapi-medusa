import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"
import SkeletonCheckoutLayout from "@/modules/common/skeletons/templates/skeleton-checkout-layout"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<SkeletonCheckoutLayout />}>
      <CheckoutLayoutContent>{children}</CheckoutLayoutContent>
    </Suspense>
  )
}

async function CheckoutLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const t = await getTranslations("Checkout")

  return (
    <div className="w-full bg-transparent relative small:min-h-screen text-foreground">
      <div className="h-16 bg-transparent border-b border-border">
        <nav className="flex h-full items-center content-container justify-between">
          <LocalizedClientLink
            href="/cart"
            className="text-small-semi text-foreground flex items-center gap-x-2 uppercase flex-1 basis-0"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90 rtl:-rotate-90" size={16} />
            <span className="mt-px hidden small:block txt-compact-plus text-muted-foreground hover:text-foreground">
              {t("back_to_cart")}
            </span>
            <span className="mt-px block small:hidden txt-compact-plus text-muted-foreground hover:text-foreground">
              {t("back")}
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="txt-compact-xlarge-plus text-foreground hover:text-muted-foreground uppercase"
            data-testid="store-link"
          >
            Your Store
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
      <div className="py-4 w-full flex items-center justify-center">
        <MedusaCTA />
      </div>
    </div>
  )
}

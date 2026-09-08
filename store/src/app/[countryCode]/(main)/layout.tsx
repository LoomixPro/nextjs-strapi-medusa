import { Suspense } from "react"
import SkeletonHeader from "@/modules/common/skeletons/components/skeleton-header"
import SkeletonLayout from "@/modules/common/skeletons/templates/skeleton-layout"
import { Metadata } from "next"
import { connection } from "next/server"
import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getBaseURL } from "@lib/util/env"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/components/footer"
import Header from "@modules/layout/components/header"
import FreeShippingPriceNudge from "@modules/common/components/free-shipping-price-nudge"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { listCategories } from "@lib/data/categories"
import FloatingCheckoutButton from "@modules/layout/components/floating-checkout-button"
import BottomNavBar from "@/modules/layout/components/bottom-nav-bar"
import { getNavigation } from "@lib/data/navigation"
import { getLocale } from "@lib/data/locale-actions"
import { draftMode } from "next/headers"
import DraftModeBanner from "@modules/layout/components/draft-mode-banner"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function PageLayoutWrapper(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<SkeletonLayout />}>
      <PageLayout params={props.params}>{props.children}</PageLayout>
    </Suspense>
  )
}

async function PageLayout(props: {
  children: React.ReactNode
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  const [settings, categories, navigationData, footerNavigationData] =
    await Promise.all([
      getStorefrontSettings(),
      listCategories(undefined, { isStatic: true }),
      getNavigation("header").catch(() => null),
      getNavigation("footer").catch(() => null),
    ])

  return (
    <Suspense fallback={<SkeletonHeader />}>
      <LayoutSession
        countryCode={countryCode}
        settings={settings}
        categories={categories}
        navigationData={navigationData}
        footerNavigationData={footerNavigationData}
      >
        {props.children}
      </LayoutSession>
    </Suspense>
  )
}

async function LayoutSession({
  countryCode,
  settings,
  categories,
  navigationData,
  footerNavigationData,
  children,
}: {
  countryCode: string
  settings: Awaited<ReturnType<typeof getStorefrontSettings>>
  categories: Awaited<ReturnType<typeof listCategories>>
  navigationData: Awaited<ReturnType<typeof getNavigation>> | null
  footerNavigationData: any[] | null | undefined
  children: React.ReactNode
}) {
  await connection()

  const [customer, cart, locale, draft] = await Promise.all([
    retrieveCustomer().catch(() => null),
    retrieveCart().catch(() => null),
    getLocale(),
    draftMode(),
  ])

  const isDraft = draft.isEnabled

  let shippingOptions: StoreCartShippingOption[] = []

  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  const hasCategories = categories && categories.length > 0

  return (
    <>
      <Header
        countryCode={countryCode}
        cart={cart}
        customer={customer}
        settings={settings}
        categories={categories}
        navigationData={navigationData}
      />
      {children}
      {customer && cart && (
        <CartMismatchBanner customer={customer} cart={cart} />
      )}
      {cart && (
        <FreeShippingPriceNudge
          variant="popup"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      <div className="hidden small:block">
        <FloatingCheckoutButton cart={cart} />
      </div>
      <BottomNavBar
        cart={cart}
        hasCategories={hasCategories}
        categories={categories}
        navigationData={navigationData}
        settings={settings}
      />
      <Footer
        settings={settings}
        footerNavigation={footerNavigationData ?? undefined}
        locale={locale}
      />
      {isDraft && <DraftModeBanner countryCode={countryCode} />}
    </>
  )
}

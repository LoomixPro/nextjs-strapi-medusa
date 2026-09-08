import React from "react"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { formatPhoneOrEmail } from "@lib/util/phone"
import { HttpTypes } from "@medusajs/types"
import { StorefrontSettings } from "@lib/data/strapi-settings"
import MobileTopBar from "@modules/layout/components/mobile-top-bar"
import { User } from "./types"
import { NAV_ITEMS as FALLBACK_NAV_ITEMS } from "./constants"
import { STYLES as HEADER_STYLES } from "./registry"

type HeaderContainerProps = {
  countryCode: string
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  settings: StorefrontSettings
  categories: HttpTypes.StoreProductCategory[] | null
  navigationData: Record<string, any>[] | null
}

const Header = async ({
  countryCode,
  cart,
  customer,
  settings,
  categories,
  navigationData,
}: HeaderContainerProps) => {
  const [locales, currentLocale] = await Promise.all([
    listLocales(),
    getLocale(),
  ])

  const cartCount =
    cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

  const user: User = {
    isLoggedIn: !!customer,
    name: customer
      ? (customer.metadata?.username as string) ||
        [customer.first_name, customer.last_name]
          .filter((p) => p && p !== "null" && p !== "undefined")
          .join(" ")
          .trim() ||
        formatPhoneOrEmail(customer.email, customer.phone)
      : undefined,
    avatar: undefined,
  }

  const displayLanguage = currentLocale || "default"

  const mapNavigationItem = (
    item: Record<string, any>
  ): Record<string, any> => ({
    id: item.uiRouterKey ?? String(item.title).toLowerCase(),
    href: item.path ?? "/",
    title: item.title,
    items:
      Array.isArray(item.items) && item.items.length > 0
        ? item.items.map(mapNavigationItem)
        : undefined,
  })

  const hasStrapiNavigation = navigationData && navigationData.length > 0

  const navItems = hasStrapiNavigation
    ? navigationData.map(mapNavigationItem)
    : FALLBACK_NAV_ITEMS

  const headerStyle = (settings?.header?.headerStyle ?? "style-1")
    .trim()
    .toLowerCase()
  const HeaderComponent = HEADER_STYLES[headerStyle] || HEADER_STYLES["style-1"]

  return (
    <>
      <div className="hidden small:block">
        <HeaderComponent
          language={displayLanguage}
          user={user}
          cartCount={cartCount}
          categories={categories}
          navItems={navItems}
          hasStrapiNavigation={hasStrapiNavigation}
          settings={settings}
          countryCode={countryCode}
          locales={locales}
          currentLocale={currentLocale}
          cart={cart}
        />
      </div>
      <MobileTopBar
        currentLocale={currentLocale ?? "default"}
        settings={settings}
        locales={locales}
        categories={categories}
        navItems={navItems}
        hasStrapiNavigation={!!hasStrapiNavigation}
        user={user}
        countryCode={countryCode}
        cartCount={cartCount}
      />
    </>
  )
}

export default Header

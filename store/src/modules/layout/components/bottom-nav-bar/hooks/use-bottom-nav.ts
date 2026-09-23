"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { Home, Store, ShoppingCart, User, type LucideIcon } from "lucide-react"
import { HttpTypes } from "@medusajs/types"

export type BottomNavItem = {
  id: string
  label: string
  icon: LucideIcon
  href: string
}

export function useBottomNav(cart?: HttpTypes.StoreCart | null) {
  const pathname = usePathname()
  const t = useTranslations("Layout.nav")

  const shouldHide = pathname.includes("/products/")

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const navItems: BottomNavItem[] = [
    { id: "home", label: t("home"), icon: Home, href: "/" },
    { id: "store", label: t("store"), icon: Store, href: "/store" },
    { id: "cart", label: t("cart"), icon: ShoppingCart, href: "/cart" },
    { id: "account", label: t("account"), icon: User, href: "/account" },
  ]

  const isItemActive = (href: string): boolean => {
    return href === "/"
      ? pathname === "/" || /^\/[a-zA-Z]{2}$/.test(pathname)
      : pathname.includes(href.split("?")[0])
  }

  const activeIndex = navItems.findIndex((item) => isItemActive(item.href))

  return {
    pathname,
    shouldHide,
    totalItems,
    navItems,
    isItemActive,
    currentActiveIndex: activeIndex >= 0 ? activeIndex : 0,
  }
}

"use client"

import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Store, ShoppingCart, User } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

import { BottomNavBarProps } from "../../index"

export function BottomNavBar({
  className,
  stickyBottom = true,
  cart,
}: BottomNavBarProps) {
  const pathname = usePathname()
  const t = useTranslations("Layout.nav")

  const totalItems =
    cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

  const navItems = [
    { id: "home", label: t("home"), icon: Home, href: "/" },
    { id: "store", label: t("store"), icon: Store, href: "/store" },
    { id: "cart", label: t("cart"), icon: ShoppingCart, href: "/cart" },
    { id: "account", label: t("account"), icon: User, href: "/account" },
  ]

  return (
    <motion.nav
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-white/70 dark:bg-neutral-950/70 backdrop-blur-2xl border-t border-white/40 dark:border-neutral-800 flex small:hidden items-center p-2 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] w-full min-h-[64px]",
        stickyBottom && "fixed inset-x-0 bottom-0 z-50",
        className
      )}
    >
      {navItems.map((item) => {
        const Icon = item.icon

        // Simple logic to check active route
        const isActive =
          item.href === "/"
            ? pathname === "/" || /^\/[a-zA-Z]{2}$/.test(pathname)
            : pathname.includes(item.href.split("?")[0])

        const buttonContent = (
          <motion.button
            whileTap={{ scale: 0.92 }}
            className={cn(
              "flex items-center justify-center gap-0 px-3 py-2 rounded-full transition-all duration-300 relative h-12 w-full",
              isActive
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md gap-2"
                : "bg-transparent text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "focus:outline-none focus-visible:ring-0"
            )}
            aria-label={item.label}
            type="button"
          >
            <div className="relative flex items-center justify-center">
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
                className="transition-colors duration-300"
              />
              {item.href === "/cart" && totalItems > 0 && (
                <span className="absolute -top-1.5 ltr:-right-2 ltr:left-auto rtl:-left-2 rtl:right-auto flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-ui-bg-interactive text-ui-fg-on-inverted text-[9px] font-bold px-1 ring-2 ring-ui-bg-base">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </div>

            <motion.div
              initial={false}
              animate={{
                width: isActive ? "auto" : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "6px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 30 },
                opacity: { duration: 0.2 },
                marginLeft: { duration: 0.2 },
              }}
              className={cn("overflow-hidden flex items-center")}
            >
              <span
                className={cn(
                  "font-semibold text-[11px] whitespace-nowrap select-none transition-opacity duration-300",
                  isActive ? "text-white dark:text-neutral-900" : "hidden"
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        )

        return (
          <LocalizedClientLink
            href={item.href}
            key={item.label}
            passHref
            className="flex-1 flex justify-center"
          >
            {buttonContent}
          </LocalizedClientLink>
        )
      })}
    </motion.nav>
  )
}

export default BottomNavBar

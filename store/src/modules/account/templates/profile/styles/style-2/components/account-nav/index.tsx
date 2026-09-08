"use client"

import { clx } from "@medusajs/ui"
import { useParams, usePathname } from "next/navigation"
import { Layout, User, MapPin, ShoppingBag, Heart, LogOut } from "lucide-react"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { signout } from "@lib/data/customer"
import { useTranslations } from "next-intl"

const AccountNav = ({
  customer: _customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }
  const t = useTranslations("Account.Nav")

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div
        className="md:hidden fixed bottom-6 left-6 right-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 px-6 py-4 z-50 flex justify-around items-center rounded-3xl shadow-[0_8px_32px_rgba(31,38,135,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
        data-testid="mobile-account-nav"
      >
        <AccountNavLinkMobile
          href="/account"
          route={route!}
          label={t("overview")}
          icon={Layout}
        />
        <AccountNavLinkMobile
          href="/account/profile"
          route={route!}
          label={t("profile")}
          icon={User}
        />
        <AccountNavLinkMobile
          href="/account/addresses"
          route={route!}
          label={t("addresses")}
          icon={MapPin}
        />
        <AccountNavLinkMobile
          href="/account/orders"
          route={route!}
          label={t("orders")}
          icon={ShoppingBag}
        />
        <AccountNavLinkMobile
          href="/account/wishlist"
          route={route!}
          label={t("wishlist")}
          icon={Heart}
        />
      </div>

      <aside
        className="hidden md:block w-72 space-y-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-3xl border border-white/50 dark:border-white/10 rounded-[32px] p-6 shadow-[0_8px_32px_rgba(31,38,135,0.07)]"
        data-testid="account-nav"
      >
        <div>
          <p className="px-4 text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4">
            {t("main_menu")}
          </p>
          <div className="space-y-1.5">
            <AccountNavLinkDesktop
              href="/account"
              route={route!}
              label={t("overview")}
              icon={Layout}
            />
            <AccountNavLinkDesktop
              href="/account/profile"
              route={route!}
              label={t("profile")}
              icon={User}
            />
            <AccountNavLinkDesktop
              href="/account/addresses"
              route={route!}
              label={t("addresses")}
              icon={MapPin}
            />
            <AccountNavLinkDesktop
              href="/account/orders"
              route={route!}
              label={t("orders")}
              icon={ShoppingBag}
            />
            <AccountNavLinkDesktop
              href="/account/wishlist"
              route={route!}
              label={t("wishlist")}
              icon={Heart}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-white/20 dark:border-zinc-800/50 italic">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] rounded-2xl font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest hover:bg-white/50 dark:hover:bg-zinc-800/50 hover:text-red-500 transition-all group border border-transparent hover:border-red-500/20 hover:shadow-lg"
            onClick={handleLogout}
            data-testid="logout-button"
          >
            <div className="group-hover:scale-110 transition-transform">
              <LogOut size={16} />
            </div>
            {t("sign_out")}
          </button>
        </div>
      </aside>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const AccountNavLinkDesktop = ({
  href,
  route,
  label,
  icon: Icon,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()
  const active =
    route.endsWith(href) ||
    (href === "/account" && route === `/${countryCode}/account`)

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-2xl transition-all duration-300 border",
        {
          "bg-white/60 dark:bg-zinc-800/60 text-primary shadow-lg shadow-primary/5 dark:shadow-primary/5 border-white/80 dark:border-white/10":
            active,
          "text-gray-500 dark:text-zinc-400 border-transparent hover:bg-white/30 dark:hover:bg-zinc-800/30 hover:text-gray-900 dark:hover:text-zinc-100":
            !active,
        }
      )}
    >
      <div
        className={clx("transition-colors duration-300", {
          "text-primary": active,
          "text-gray-400 dark:text-zinc-500": !active,
        })}
      >
        <Icon size={18} />
      </div>
      <span className="tracking-wide">{label}</span>
      {active && (
        <div className="ms-auto w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50 transition-all"></div>
      )}
    </LocalizedClientLink>
  )
}

const AccountNavLinkMobile = ({
  href,
  route,
  label,
  icon: Icon,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()
  const active =
    route.endsWith(href) ||
    (href === "/account" && route === `/${countryCode}/account`)

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex flex-col items-center gap-1.5 flex-1 py-1 transition-all",
        {
          "text-primary": active,
          "text-gray-400 dark:text-zinc-500": !active,
        }
      )}
    >
      <div
        className={clx("transition-all duration-500", {
          "scale-110 -translate-y-1": active,
          "scale-100": !active,
        })}
      >
        <Icon size={22} />
      </div>
      <span
        className={clx(
          "text-[8px] font-bold tracking-[0.15em] uppercase transition-all duration-500",
          {
            "opacity-100": active,
            "opacity-40": !active,
          }
        )}
      >
        {label}
      </span>
      {active && (
        <div className="w-1 h-1 rounded-full bg-primary shadow-sm shadow-primary/50"></div>
      )}
    </LocalizedClientLink>
  )
}

export default AccountNav

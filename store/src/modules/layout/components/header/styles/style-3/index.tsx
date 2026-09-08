"use client"

import React, { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useThemeToggle } from "@lib/hooks/use-theme-toggle"
import {
  Menu,
  User as UserIcon,
  UserCheck,
  LogIn,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Globe,
  ChevronDown,
} from "lucide-react"
import { HeaderProps } from "../../types"
import { cn } from "@lib/utils"
import { isRtlLocale } from "@lib/util/is-rtl"
import { Button } from "@modules/common/components/shadcn/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@modules/common/components/shadcn/dropdown-menu"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import { signout } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import LanguageSelect from "@modules/layout/components/language-select"
import { useTranslations } from "next-intl"
import { CategoryMenu } from "../../category-menu"
import SearchExperience from "@modules/common/components/search"
import { updateLocale } from "@lib/data/locale-actions"
import { dispatchLocaleChange } from "@lib/i18n/locale-change-event"
import CartDropdown from "@modules/layout/components/cart-dropdown"
import {
  DesktopNavigationItem,
  MobileNavigationItem,
} from "../../navigation-item"

/**
 * Header Style 3: Cyber-Glass Dual-Tier Header
 * Features a collapsible top announcement bar and a floating glass dock navigation with ambient glows.
 */
const Header3: React.FC<HeaderProps> = ({
  language,
  user,
  cartCount,
  categories,
  settings,
  countryCode,
  locales,
  currentLocale,
  cart,
  navItems = [],
  hasStrapiNavigation = false,
}) => {
  const handleLogout = async () => {
    if (countryCode) {
      await signout(countryCode)
    }
  }

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const languageToggleState = useToggleState()
  const { toggleTheme, resolvedTheme } = useThemeToggle()
  const t = useTranslations("Layout.nav")
  const tHeader = useTranslations("Layout.header")

  const isRtl = isRtlLocale(currentLocale, settings)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const STRAPI_URL =
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    "http://localhost:1337"

  const getLogo = () => {
    const logoLight = settings?.header?.logoLight
    const logoDark = settings?.header?.logoDark

    if (!logoLight && !logoDark) return null

    const renderLogo = (logoConfig: any, isDark: boolean) => {
      if (!logoConfig) return null

      if (logoConfig.type === "text" && logoConfig.text) {
        return (
          <span
            className={cn(
              "text-2xl font-black tracking-widest bg-gradient-to-r from-primary via-indigo-400 to-purple-500 bg-clip-text text-transparent font-['Courier_New',monospace]",
              isDark ? "hidden dark:block" : "dark:hidden"
            )}
          >
            {logoConfig.text}
          </span>
        )
      }

      if (logoConfig.type === "image" && logoConfig.image) {
        let imageUrl = ""
        const img = logoConfig.image

        if ("data" in img && img.data?.attributes?.url) {
          imageUrl = img.data.attributes.url
        } else if ("url" in img && img.url) {
          imageUrl = img.url
        }

        if (imageUrl) {
          if (!imageUrl.startsWith("http")) {
            imageUrl = `${STRAPI_URL}${imageUrl}`
          }
          return (
            <Image
              src={imageUrl}
              alt="Logo"
              width={180}
              height={60}
              className={cn(
                "h-10 w-auto object-contain",
                isDark ? "hidden dark:block" : "dark:hidden"
              )}
            />
          )
        }
      }
      return null
    }

    return (
      <div className="flex items-center">
        {renderLogo(logoLight, false)}
        {renderLogo(logoDark, true)}
      </div>
    )
  }

  const logoContent = getLogo()

  return (
    <header
      suppressHydrationWarning
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out"
    >
      {/* Main Dynamic Floating Glass Dock */}
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-3">
        <div
          className={cn(
            "relative rounded-2xl transition-all duration-500 border backdrop-blur-xl shadow-2xl flex items-center justify-between h-16 px-4 sm:px-6",
            isScrolled
              ? "bg-background/85 dark:bg-zinc-950/85 border-primary/20 shadow-primary/10"
              : "bg-background/70 dark:bg-zinc-950/70 border-border/50 shadow-black/5"
          )}
        >
          {/* Subtle Ambient Glow Effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/10 via-purple-500/10 to-indigo-500/10 pointer-events-none opacity-50 blur-sm"></div>

          {/* Left: Mobile Toggle & Logo & Category Trigger */}
          <div className="flex items-center gap-3 relative z-10">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground h-9 w-9 rounded-xl hover:bg-muted/80"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={22} />
            </Button>

            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 cursor-pointer group"
            >
              {logoContent ? (
                <div className="h-10 flex items-center">{logoContent}</div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-black text-xl tracking-tight text-foreground uppercase">
                    {settings?.siteName || "LOOMIX"}
                  </span>
                </div>
              )}
            </LocalizedClientLink>

            {categories && categories.length > 0 && (
              <div className="hidden lg:block border-r dark:border-zinc-800 pr-3 mr-1">
                <CategoryMenu categories={categories} />
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Bar */}
          <div className="hidden lg:flex items-center gap-1 bg-muted/40 dark:bg-zinc-900/50 p-1.5 rounded-full border border-border/40 backdrop-blur-md relative z-10">
            {navItems.map((item) => (
              <DesktopNavigationItem key={item.id} item={item} t={t} />
            ))}
          </div>

          {/* Right: Actions (Search, Theme, Language, Account, Cart) */}
          <div className="flex items-center gap-2 relative z-10">
            <SearchExperience
              indexName={
                process.env.NEXT_PUBLIC_MEILISEARCH_INDEX_NAME || "products"
              }
              iconOnly={true}
              attributes={{
                primaryText: "title",
                secondaryText: "description",
                image: "thumbnail",
                url: "url",
              }}
              transformItems={(items) =>
                items.map((hit: any) => ({
                  ...hit,
                  url: `/products/${hit.handle}`,
                }))
              }
            />

            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-xl hover:bg-muted/80 text-foreground transition-all"
                title="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="h-4 w-4 text-amber-400" />
                ) : (
                  <Moon className="h-4 w-4 text-indigo-600" />
                )}
              </Button>
            )}

            {/* Language Select (Country Flag Icon Dropdown) */}
            <div
              className="hidden sm:flex items-center justify-center h-9 w-9"
              onMouseEnter={languageToggleState.open}
              onMouseLeave={languageToggleState.close}
            >
              <LanguageSelect
                toggleState={languageToggleState}
                locales={locales || []}
                currentLocale={currentLocale || null}
                size="sm"
              />
            </div>

            {/* User Account Button (Icon-based for Logged-In & Logged-Out states) */}
            {user.isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative w-9 h-9 rounded-xl hover:bg-muted/80 text-foreground transition-all"
                    title={user.name || t("account")}
                  >
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background"></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl shadow-xl"
                >
                  <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground">
                    {user.name || t("account")}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LocalizedClientLink href="/account">
                      <UserIcon className="w-4 h-4 mr-2" />
                      {t("account")}
                    </LocalizedClientLink>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <LocalizedClientLink href="/account">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-xl hover:bg-muted/80 text-foreground transition-all"
                  title={t("login")}
                >
                  <LogIn className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </LocalizedClientLink>
            )}

            {/* Cart Dropdown with Dynamic Empty vs Filled Icon States */}
            <CartDropdown
              cart={cart}
              customTrigger={
                <LocalizedClientLink
                  href="/cart"
                  aria-label={t("cart") || "Shopping Cart"}
                  className="relative flex items-center justify-center w-9 h-9 rounded-xl hover:bg-muted/80 text-foreground transition-all"
                  title={t("cart")}
                >
                  {cartCount > 0 ? (
                    <>
                      <ShoppingBag className="w-4.5 h-4.5 text-primary" />
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground font-bold text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full shadow-sm shadow-primary/30 ring-2 ring-background">
                        {cartCount}
                      </span>
                    </>
                  ) : (
                    <ShoppingCart className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground transition-colors opacity-75" />
                  )}
                </LocalizedClientLink>
              }
            />
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-full bg-background/95 backdrop-blur-2xl border-b border-border shadow-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {categories && categories.length > 0 && (
            <div className="pb-3 border-b border-border">
              <CategoryMenu categories={categories} />
            </div>
          )}

          <div className="space-y-1">
            {navItems.map((item) => (
              <MobileNavigationItem
                key={item.id}
                item={item}
                t={t}
                setIsMenuOpen={setIsMenuOpen}
                isRtl={isRtl}
              />
            ))}
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-between">
            <LanguageSelect
              toggleState={languageToggleState}
              locales={locales || []}
              currentLocale={currentLocale}
              size="sm"
            />
          </div>
        </div>
      )}
    </header>
  )
}

export default Header3

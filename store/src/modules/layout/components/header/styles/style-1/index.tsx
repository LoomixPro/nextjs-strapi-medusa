"use client"

import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useThemeToggle } from "@lib/hooks/use-theme-toggle"
import {
  Menu,
  ShoppingCart,
  User as UserIcon,
  Sun,
  Moon,
  Languages,
  LogOut,
  LogIn,
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
 * Guide for creating a new Header Template style
 *
 * This component serves as the global navigation header for the store.
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props - `HeaderProps`):
 *    - `user`: The logged-in customer object (if any). Use this to toggle between "Log in"
 *      and "My Account" states.
 *    - `cart` / `cartCount`: Data required to render the cart dropdown or cart indicator.
 *    - `categories`: The Medusa product categories, typically used in a mega-menu or dropdown.
 *    - `navItems`: The navigation links configured in Strapi (if `hasStrapiNavigation` is true).
 *    - `settings`: Storefront settings, which can contain the logo and global configurations.
 *    - Locale Info (`language`, `locales`, `currentLocale`, `countryCode`): Used for routing
 *      and the language selector.
 *
 * 2. Component Structure:
 *    - Desktop Navigation: Usually a horizontal bar containing the logo, links (`DesktopNavigationItem`),
 *      search bar (`SearchExperience`), and user actions (Account, CartDropdown, Theme toggle).
 *    - Mobile Navigation: Typically uses a hamburger menu that opens a drawer or dropdown
 *      (`MobileNavigationItem`), hiding complex elements to save space.
 *
 * 3. Interactivity & State:
 *    - Scroll behavior: You might want to track scroll state (`isScrolled`) to apply glassmorphism
 *      or shrink the header on scroll.
 *    - Theme & Locales: Provide toggles for dark/light mode (`useTheme`) and language (`updateLocale`).
 *
 * 4. Final Output (Return):
 *    Your component should return a responsive `<header>` element with a sticky or fixed position.
 *    Ensure Z-indexes are set appropriately so the header stays above page content.
 */
const Header1: React.FC<HeaderProps> = ({
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
  const [isScrolling, setIsScrolling] = useState(false)
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
    let isScrollingTimeout: NodeJS.Timeout

    const handleScroll = () => {
      const currentScrollY = window.scrollY

      // Only update state if it actually changed
      if (currentScrollY > 20 !== isScrolled) {
        setIsScrolled(currentScrollY > 20)
      }

      if (currentScrollY > 50 !== isScrolling) {
        setIsScrolling(currentScrollY > 50)
      }

      clearTimeout(isScrollingTimeout)

      isScrollingTimeout = setTimeout(() => {
        setIsScrolling(false)
      }, 300)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearTimeout(isScrollingTimeout)
    }
  }, [isScrolled, isScrolling])

  const STRAPI_URL =
    process.env.STRAPI_URL ||
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
              "ml-auto text-[26px] font-bold tracking-[4px] no-underline bg-[linear-gradient(135deg,#e8c547,#c8a96e,#f0d080,#a07840,#e8c547)] [background-size:200%_auto] bg-clip-text text-transparent animate-shimmer font-['Courier_New',monospace] relative",
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
              width={200}
              height={100}
              className={cn(
                "h-36 lg:h-48 w-auto object-contain",
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
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition duration-500 ease-in-out bg-background border-b border-border",
        isScrolling
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Left Section: Mobile Toggle & Logo (Now both mobile & desktop) */}
          <div className="flex items-center gap-3 w-1/3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-foreground h-10 w-10 -ml-1"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={30} />
            </Button>

            <LocalizedClientLink
              href="/"
              className="flex items-center gap-2 cursor-pointer"
            >
              {logoContent ? (
                <div className="h-20 lg:h-48 flex items-center">
                  {logoContent}
                </div>
              ) : (
                <>
                  <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
                    <span className="text-background font-bold text-xl">
                      {(settings?.siteName || "L").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="hidden sm:block font-bold text-xl tracking-tight text-foreground uppercase">
                    {settings?.siteName || "LOOMIX"}
                  </span>
                </>
              )}
            </LocalizedClientLink>
          </div>

          {/* Center Section: Desktop Nav (Empty on mobile) */}
          <div className="flex-1 flex justify-center items-center">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {/* Categories Dropdown */}
              {categories && categories.length > 0 && (
                <CategoryMenu categories={categories} language={language} />
              )}

              {navItems.map((item) => (
                <DesktopNavigationItem key={item.id} item={item} t={t} />
              ))}
            </nav>
          </div>

          {/* Right Side: Search, Tools, Profile */}
          <div className="flex items-center justify-end gap-2 w-1/3">
            {/* Lang Toggle */}
            <div
              className="hidden lg:flex items-center justify-center h-9 w-9"
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

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden lg:flex items-center justify-center text-foreground rounded-full h-9 w-9 hover:bg-muted transition-colors p-0"
              title={tHeader("toggle_theme")}
            >
              {mounted ? (
                resolvedTheme === "light" ? (
                  <Moon size={18} />
                ) : (
                  <Sun size={18} />
                )
              ) : (
                <div className="w-[18px] h-[18px]" />
              )}
            </button>
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

            {/* Cart */}
            <div className="hidden lg:flex items-center justify-center h-9 w-9">
              <CartDropdown
                cart={cart}
                customTrigger={
                  <LocalizedClientLink
                    href="/cart"
                    aria-label={t("cart") || "Shopping Cart"}
                    className="relative flex items-center justify-center text-foreground rounded-full h-9 w-9 hover:bg-muted transition-colors p-0"
                  >
                    <ShoppingCart size={18} />
                    {mounted && cartCount > 0 && (
                      <span className="absolute top-0 right-0 bg-foreground text-background text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-background transform translate-x-1 -translate-y-1">
                        {cartCount}
                      </span>
                    )}
                  </LocalizedClientLink>
                }
              />
            </div>
            <div className="lg:hidden flex items-center justify-center h-9 w-9">
              <LocalizedClientLink
                href="/cart"
                aria-label={t("cart") || "Shopping Cart"}
                className="relative flex items-center justify-center text-foreground rounded-full h-9 w-9 hover:bg-muted transition-colors p-0"
              >
                <ShoppingCart size={18} />
                {mounted && cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-foreground text-background text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-background transform translate-x-1 -translate-y-1">
                    {cartCount}
                  </span>
                )}
              </LocalizedClientLink>
            </div>

            {/* User Profile */}
            <div className="relative flex items-center justify-center h-9 w-9">
              {user.isLoggedIn ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center p-0 rounded-full w-full h-full hover:bg-muted focus:outline-none transition-all">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name || "User Avatar"}
                          width={28}
                          height={28}
                          className="rounded-full border border-border object-cover"
                        />
                      ) : (
                        <UserIcon size={18} className="text-foreground" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isRtl ? "start" : "end"}
                    className="w-48 bg-background border-border shadow-2xl"
                  >
                    <DropdownMenuLabel className="text-foreground font-semibold text-xs px-3 py-2">
                      {user.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-muted" />
                    <DropdownMenuItem className="text-foreground focus:bg-muted cursor-pointer text-xs">
                      <LocalizedClientLink
                        href="/account"
                        className="flex items-center w-full py-2"
                      >
                        <UserIcon size={18} className="mr-2" />
                        {t("profile")}
                      </LocalizedClientLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer text-xs py-2"
                    >
                      <LogOut size={18} className="mr-2" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <LocalizedClientLink
                  href="/account"
                  className="flex items-center justify-center text-foreground rounded-full w-full h-full p-0 hover:bg-muted transition-colors"
                  title={t("login")}
                >
                  <LogIn size={18} className="rtl:-scale-x-100" />
                </LocalizedClientLink>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu (Minimal) */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-background/98 backdrop-blur-xl animate-in slide-in-from-top duration-300">
          <div className="px-5 py-4 space-y-4">
            {hasStrapiNavigation ? (
              <div className="w-full">
                <div className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  {t("categories")}
                </div>
                <div className="flex flex-col gap-1">
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
              </div>
            ) : (
              <>
                {/* Fallback Nav Items */}
                {navItems.length > 0 && (
                  <div className="flex flex-col gap-1">
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
                )}

                {/* Categories Box (Minimal) */}
                {categories && categories.length > 0 && (
                  <div className="pt-2">
                    <CategoryMenu
                      categories={categories}
                      mobile={true}
                      setIsOpen={setIsMenuOpen}
                      language={language}
                    />
                  </div>
                )}
              </>
            )}

            {/* Toggles */}
            <div className="pt-4 border-t border-border flex justify-between gap-3">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                className="flex items-center gap-2 py-2 h-9 rounded-lg flex-1 justify-center font-semibold text-[11px] border border-border bg-muted/50 text-foreground"
              >
                {mounted ? (
                  <>
                    {resolvedTheme === "light" ? (
                      <Moon size={14} />
                    ) : (
                      <Sun size={14} />
                    )}
                    {resolvedTheme === "light"
                      ? tHeader("dark")
                      : tHeader("light")}
                  </>
                ) : (
                  <div className="w-14 h-[14px]" /> // placeholder
                )}
              </Button>
              <div className="flex-1 flex items-center justify-center border border-border bg-muted/50 rounded-lg h-9">
                <LanguageSelect
                  toggleState={languageToggleState}
                  locales={locales || []}
                  currentLocale={currentLocale}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header1

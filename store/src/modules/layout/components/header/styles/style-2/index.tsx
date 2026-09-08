"use client"

import React, { useState, useEffect } from "react"
import { useThemeToggle } from "@lib/hooks/use-theme-toggle"
import Image from "next/image"
import {
  Menu,
  ShoppingCart,
  User as UserIcon,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  Languages,
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
import { useTranslations } from "next-intl"
import { CategoryMenu } from "../../category-menu"
import SearchExperience from "@modules/common/components/search"

import { signout } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import LanguageSelect from "@modules/layout/components/language-select"
import { updateLocale } from "@lib/data/locale-actions"
import { dispatchLocaleChange } from "@lib/i18n/locale-change-event"
import { useTransition } from "react"
import { useRouter } from "next/navigation"
import CartDropdown from "@modules/layout/components/cart-dropdown"
import {
  DesktopNavigationItem,
  MobileNavigationItem,
} from "../../navigation-item"
import ShinyText from "@modules/common/components/ShinyText"

const Header2: React.FC<HeaderProps> = ({
  language,
  user,
  cartCount,
  categories,
  onLogin = () => {},
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
  const [isScrolled, setIsScrolled] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toggleTheme, resolvedTheme } = useThemeToggle()
  const t = useTranslations("Layout.nav")
  const tHeader = useTranslations("Layout.header")
  const languageToggleState = useToggleState()
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
          <ShinyText
            text={logoConfig.text}
            speed={3}
            className={cn(
              "ml-auto text-[26px] font-bold tracking-[4px] no-underline font-['Courier_New',monospace] text-foreground relative [direction:ltr]",
              isDark ? "hidden dark:block" : "dark:hidden"
            )}
          />
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
        "fixed top-0 left-0 right-0 z-50 transition duration-500 ease-in-out px-4",
        isScrolled ? "pt-1" : "pt-2",
        isScrolling
          ? "-translate-y-full opacity-0 pointer-events-none"
          : "translate-y-0 opacity-100"
      )}
    >
      <div
        className={cn(
          "max-w-7xl mx-auto rounded-2xl transition duration-300 border",
          isScrolled
            ? "shadow-2xl shadow-primary/20 translate-y-2 scale-[0.98] backdrop-blur-md border-primary/20 bg-gradient-to-b from-background/95 to-muted/40 dark:to-foreground/10"
            : "shadow-[0_0_20px_rgba(0,0,0,0.03)] dark:shadow-none shadow-primary/10 border-primary/10 bg-gradient-to-b from-background to-muted/30 dark:to-foreground/5"
        )}
      >
        <div className="px-6 h-16 flex items-center justify-between">
          {/* Left Section: Mobile Toggle (mobile) & Logo (desktop) */}
          <div className="flex-1 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Menu size={24} />
            </Button>

            {/* Logo on Desktop (Left Aligned) */}
            <div className="hidden lg:block">
              <LocalizedClientLink href="/" className="flex items-center">
                {logoContent || (
                  <span className="font-bold text-xl tracking-tight text-foreground uppercase">
                    {settings?.siteName || "LOOMIX"}
                  </span>
                )}
              </LocalizedClientLink>
            </div>
          </div>

          {/* Center Section: Logo (mobile) & Navigation (desktop) */}
          <div className="flex shrink-0 items-center justify-center px-4">
            {/* Logo on Mobile (Centered) */}
            <div className="lg:hidden">
              <LocalizedClientLink href="/" className="flex items-center">
                {logoContent || (
                  <span className="font-bold text-xl tracking-tight text-foreground uppercase">
                    {settings?.siteName || "LOOMIX"}
                  </span>
                )}
              </LocalizedClientLink>
            </div>

            {/* Desktop Navigation (Centered on lg+) */}
            <nav className="hidden lg:flex items-center gap-2">
              {/* Categories */}
              <CategoryMenu categories={categories} language={language} />

              {navItems.map((item) => (
                <DesktopNavigationItem key={item.id} item={item} t={t} />
              ))}
            </nav>
          </div>

          {/* Right Section: Tools */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Lang Toggle */}
            <div
              className="hidden lg:flex items-center justify-center h-10 w-10"
              onMouseEnter={languageToggleState.open}
              onMouseLeave={languageToggleState.close}
            >
              <LanguageSelect
                toggleState={languageToggleState}
                locales={locales || []}
                currentLocale={currentLocale || null}
              />
            </div>
            {/* Unified Search Modal */}
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

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hidden lg:flex h-10 w-10 rounded-xl border border-border hover:bg-muted transition-colors"
              title={tHeader("toggle_theme")}
            >
              {mounted ? (
                resolvedTheme === "light" ? (
                  <Moon size={20} />
                ) : (
                  <Sun size={20} />
                )
              ) : (
                <div className="w-[20px] h-[20px]" />
              )}
            </Button>

            {/* Cart */}
            <div className="hidden lg:block relative">
              <CartDropdown
                cart={cart}
                customTrigger={
                  <LocalizedClientLink
                    href="/cart"
                    aria-label={t("cart") || "Shopping Cart"}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("cart") || "Shopping Cart"}
                      className="h-10 w-10 flex items-center justify-center relative rounded-xl border border-border hover:bg-muted transition-colors"
                    >
                      <ShoppingCart size={20} />
                      {mounted && cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </LocalizedClientLink>
                }
              />
            </div>
            <div className="lg:hidden">
              <LocalizedClientLink
                href="/cart"
                aria-label={t("cart") || "Shopping Cart"}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("cart") || "Shopping Cart"}
                  className="h-10 w-10 flex items-center justify-center relative rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <ShoppingCart size={20} />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </Button>
              </LocalizedClientLink>
            </div>

            {/* User / Login */}
            <div className="relative">
              {user.isLoggedIn ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="h-10 flex items-center gap-2 p-1 pl-2 border border-border rounded-xl hover:bg-muted transition-colors"
                    >
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name || "User Avatar"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <UserIcon size={16} />
                        </div>
                      )}
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isRtl ? "start" : "end"}
                    className="w-48 bg-background border-border"
                  >
                    <DropdownMenuLabel className="font-semibold">
                      {user.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem className="focus:bg-muted">
                      <LocalizedClientLink
                        href="/account"
                        className="flex items-center w-full"
                      >
                        <UserIcon size={16} className="mr-2" />
                        {t("profile")}
                      </LocalizedClientLink>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive focus:bg-destructive/10"
                    >
                      <LogOut size={16} className="mr-2" />
                      {t("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <LocalizedClientLink href="/account">
                  <button
                    onClick={onLogin}
                    className="relative group p-[1px] rounded-xl overflow-hidden shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary animate-gradient-x"></div>
                    <div className="relative px-6 py-2 rounded-[11px] font-bold text-sm bg-background transition-colors group-hover:bg-opacity-90">
                      {t("login")}
                    </div>
                  </button>
                </LocalizedClientLink>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md overflow-hidden transition-all duration-300 shadow-xl">
            <div className="p-4 space-y-4">
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
                  className="flex items-center gap-2 py-2 h-9 rounded-lg flex-1 justify-center font-semibold text-[11px] border border-border bg-muted/30"
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
                <div className="flex-1 flex items-center justify-center border border-border bg-muted/30 rounded-lg h-9">
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
      </div>
    </header>
  )
}

export default Header2

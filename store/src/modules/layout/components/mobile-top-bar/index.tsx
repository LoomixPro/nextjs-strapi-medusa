"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Menu,
  Sun,
  Moon,
  User as UserIcon,
  Home,
  Store,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@modules/common/components/shadcn/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@modules/common/components/shadcn/sheet"
import { useThemeToggle } from "@lib/hooks/use-theme-toggle"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { cn } from "@lib/utils"
import SearchExperience from "@modules/common/components/search"
import useToggleState from "@lib/hooks/use-toggle-state"
import LanguageSelect from "@modules/layout/components/language-select"
import { Locale } from "@lib/data/locales"
import { CategoryMenu } from "@modules/layout/components/header/category-menu"
import { MobileNavigationItem } from "@modules/layout/components/header/navigation-item"
import { isRtlLocale } from "@lib/util/is-rtl"
import { useTranslations } from "next-intl"

export interface MobileTopBarProps {
  currentLocale: string
  settings?: any
  locales?: Locale[] | null
  categories?: any[] | null
  navItems?: any[]
  hasStrapiNavigation?: boolean
  user?: {
    isLoggedIn: boolean
    name?: string
  }
  countryCode?: string
  cartCount?: number
}

export default function MobileTopBar({
  currentLocale,
  settings,
  locales,
  categories = [],
  navItems = [],
  hasStrapiNavigation = false,
  user,
  cartCount = 0,
}: MobileTopBarProps) {
  const { toggleTheme, resolvedTheme } = useThemeToggle()
  const [mounted, setMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const languageToggleState = useToggleState()
  const t = useTranslations("Layout.nav")
  const tHeader = useTranslations("Layout.header")

  const isRtl = isRtlLocale(currentLocale, settings)

  useEffect(() => {
    setMounted(true)
  }, [])

  const STRAPI_URL =
    process.env.STRAPI_URL ||
    process.env.NEXT_PUBLIC_STRAPI_URL ||
    "http://localhost:1337"

  const getLogo = (isDrawer = false) => {
    const logoLight = settings?.header?.logoLight
    const logoDark = settings?.header?.logoDark

    if (!logoLight && !logoDark)
      return (
        <span
          className={cn(
            "font-black tracking-tight",
            isDrawer ? "text-lg" : "text-base"
          )}
        >
          Logo
        </span>
      )

    const renderLogo = (logoConfig: any, isDark: boolean) => {
      if (!logoConfig) return null

      if (logoConfig.type === "text" && logoConfig.text) {
        return (
          <span
            className={cn(
              "font-bold tracking-[2px] no-underline bg-[linear-gradient(135deg,#e8c547,#c8a96e,#f0d080,#a07840,#e8c547)] [background-size:200%_auto] bg-clip-text text-transparent animate-shimmer font-['Courier_New',monospace] relative",
              isDrawer ? "text-[18px]" : "text-[16px]",
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
              width={120}
              height={32}
              className={cn(
                isDrawer ? "h-8 w-auto" : "h-7 w-auto",
                "object-contain",
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

  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <div className="flex small:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-50 items-center justify-between px-3 border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs">
      {/* Start: Hamburger Menu Trigger + Logo */}
      <div className="flex items-center gap-2">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-foreground transition-colors"
              aria-label={t("menu")}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isRtl ? "right" : "left"}
            className="w-[85vw] max-w-sm p-0 flex flex-col h-full bg-background border-border shadow-2xl z-[100]"
          >
            {/* Drawer Header */}
            <SheetHeader className="px-5 py-4 border-b border-border/60 flex flex-row items-center justify-between text-start">
              <SheetTitle asChild>
                <LocalizedClientLink
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center"
                >
                  {getLogo(true)}
                </LocalizedClientLink>
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t("menu")}
              </SheetDescription>
            </SheetHeader>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6 no-scrollbar">
              {/* User Greeting / Login Banner */}
              {user?.isLoggedIn ? (
                <LocalizedClientLink
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 p-3.5 bg-muted/60 hover:bg-muted rounded-2xl border border-border/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {t("account")}
                    </p>
                    <p className="text-sm font-bold text-foreground truncate">
                      {user.name}
                    </p>
                  </div>
                  <ChevronIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </LocalizedClientLink>
              ) : (
                <LocalizedClientLink
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-between p-3.5 bg-primary/10 hover:bg-primary/15 text-primary rounded-2xl border border-primary/20 transition-all font-bold text-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <UserIcon size={18} />
                    <span>{t("login_register")}</span>
                  </div>
                  <ChevronIcon className="w-4 h-4" />
                </LocalizedClientLink>
              )}

              {/* Quick Navigation Cards */}
              <div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                  {t("quick_links")}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <LocalizedClientLink
                    href="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/80 text-xs font-semibold text-foreground transition-all duration-200 shadow-xs"
                  >
                    <Home className="w-4 h-4 mb-1.5 text-muted-foreground" />
                    {t("home")}
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    href="/store"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/80 text-xs font-semibold text-foreground transition-all duration-200 shadow-xs"
                  >
                    <Store className="w-4 h-4 mb-1.5 text-muted-foreground" />
                    {t("store")}
                  </LocalizedClientLink>
                  <LocalizedClientLink
                    href="/cart"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl bg-card border border-border/60 hover:bg-muted/80 text-xs font-semibold text-foreground transition-all duration-200 shadow-xs relative"
                  >
                    <ShoppingCart className="w-4 h-4 mb-1.5 text-muted-foreground" />
                    {t("cart")}
                    {cartCount > 0 && (
                      <span className="absolute top-2 right-2 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold px-1">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </LocalizedClientLink>
                </div>
              </div>

              {/* Product Categories Section */}
              {categories && categories.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <CategoryMenu
                    categories={categories}
                    mobile={true}
                    setIsOpen={setIsMenuOpen}
                    language={currentLocale}
                    hideTitle={false}
                  />
                </div>
              )}

              {/* Dynamic Strapi Navigation Section */}
              {hasStrapiNavigation && navItems.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <div className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                    {t("menu")}
                  </div>
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
                </div>
              )}
            </div>

            {/* Drawer Footer: Theme & Language */}
            <div className="px-5 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-3">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/60 hover:bg-muted text-xs font-medium text-foreground transition-colors"
              >
                {mounted ? (
                  resolvedTheme === "light" ? (
                    <>
                      <Moon size={15} />
                      <span>{tHeader("dark_mode")}</span>
                    </>
                  ) : (
                    <>
                      <Sun size={15} />
                      <span>{tHeader("light_mode")}</span>
                    </>
                  )
                ) : (
                  <div className="w-16 h-4" />
                )}
              </button>

              {/* Language Selector */}
              <div className="flex items-center">
                <LanguageSelect
                  toggleState={languageToggleState}
                  locales={locales || []}
                  currentLocale={currentLocale}
                  size="sm"
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Top Bar Logo */}
        <LocalizedClientLink href="/" className="flex items-center shrink-0">
          {getLogo()}
        </LocalizedClientLink>
      </div>

      {/* End: Search & Quick Actions */}
      <div className="flex items-center gap-1">
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
          className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-200"
          aria-label="Toggle Theme"
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
        </Button>

        {/* Language Select */}
        <div className="flex items-center justify-center h-9 w-9">
          <LanguageSelect
            toggleState={languageToggleState}
            locales={locales || []}
            currentLocale={currentLocale}
            size="sm"
          />
        </div>
      </div>
    </div>
  )
}

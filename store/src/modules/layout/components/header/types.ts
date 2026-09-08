import { HttpTypes } from "@medusajs/types"
import { StorefrontSettings } from "@lib/data/strapi-settings"

export type Language = string

export interface User {
  isLoggedIn: boolean
  name?: string
  avatar?: string
}

export type Category = HttpTypes.StoreProductCategory

export interface NavItem {
  id: string
  href: string
  title?: string
  items?: NavItem[]
}

export interface HeaderProps {
  language: Language
  toggleLanguage?: () => void
  user: User
  cartCount: number
  categories: Category[]
  navItems?: NavItem[]
  hasStrapiNavigation?: boolean
  onLogin?: () => void
  onLogout?: () => void
  settings?: StorefrontSettings
  countryCode?: string
  locales?: HttpTypes.StoreLocale[] | null
  currentLocale?: string | null
  cart?: HttpTypes.StoreCart | null
}

export type { StorefrontSettings }

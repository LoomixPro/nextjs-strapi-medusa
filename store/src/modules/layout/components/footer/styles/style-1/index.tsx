"use client"

import React, { useState } from "react"
import { Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FOOTER_SECTIONS } from "../../constants"
import { Button } from "@modules/common/components/shadcn/button"
import { Input } from "@modules/common/components/shadcn/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FooterStyleComponentProps, SOCIAL_ICONS } from "../../shared"
import { FooterLogo } from "../../logo"
import { useTranslations } from "next-intl"

/**
 * Guide for creating a new Footer Template style
 *
 * This component acts as the layout structure for the global site footer.
 * If you intend to create a new style (e.g., style-3), you must consider the following:
 *
 * 1. Received Data (Props - `FooterStyleComponentProps`):
 *    - `brandName`: The name of the store/brand.
 *    - `description`: A short blurb or tagline about the brand.
 *    - `copyright`: The copyright text to be displayed at the bottom.
 *    - `logo`: An object containing the logo URL and dimensions.
 *    - `activeSocialLinks`: An array of social media profiles enabled in the CMS.
 *    - `footerNavigation`: Data structure containing links and categories for the footer menu.
 *
 * 2. Component Structure:
 *    - Branding Section: Typically includes the `FooterLogo` and `description`.
 *    - Link Columns: Iterate over `FOOTER_SECTIONS` and `footerNavigation` to display
 *      categorized links (e.g., Shop, About Us).
 *    - Newsletter/Subscribe: A form to collect user emails (POSTs to `/api/newsletter`).
 *    - Bottom Bar: Contains `copyright` and social media icons (`activeSocialLinks`).
 *
 * 3. Utilizing Helpers:
 *    - Use the provided `FooterLogo` component to standardize logo rendering.
 *    - Ensure you use `LocalizedClientLink` for internal routing to maintain locale states.
 *
 * 4. Final Output (Return):
 *    Your component should return a responsive JSX `<footer>` element. Make sure columns
 *    stack appropriately on mobile (e.g., using `grid-cols-1 md:grid-cols-4`).
 */
const FooterStyle1: React.FC<FooterStyleComponentProps> = ({
  brandName,
  description,
  copyright,
  activeSocialLinks,
  logoLight,
  logoDark,
  logo,
  footerNavigation,
}) => {
  const t = useTranslations("Layout.footer")
  const [isLoading, setIsLoading] = useState(false)
  const shopLinks =
    footerNavigation && footerNavigation.length > 0
      ? footerNavigation.map((item) => ({
          label: item.title,
          href: item.path || "/",
        }))
      : FOOTER_SECTIONS.product.links.map((link) => ({
          label: t(link.label),
          href: link.href,
        }))
  return (
    <footer className="bg-card text-card-foreground border-t border-border py-16 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <FooterLogo
                logoLight={logoLight}
                logoDark={logoDark}
                logo={logo}
              />
            </div>
            <p className="text-muted-foreground mb-8 max-w-sm">{description}</p>

            {/* Social Links */}
            {activeSocialLinks.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                {activeSocialLinks.map((social, idx) => (
                  <a
                    key={idx}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-secondary text-secondary-foreground rounded-full hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    {SOCIAL_ICONS[social.platform]}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop Column */}
          <div>
            <h4 className="text-foreground font-semibold mb-6">
              {t(FOOTER_SECTIONS.product.title)}
            </h4>
            <ul className="space-y-4">
              {shopLinks.map((link, idx) => (
                <li key={idx}>
                  <LocalizedClientLink
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {link.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-foreground font-semibold mb-6">
              {t(FOOTER_SECTIONS.company.title)}
            </h4>
            <ul className="space-y-4">
              {FOOTER_SECTIONS.company.links.map((link, idx) => (
                <li key={idx}>
                  <LocalizedClientLink
                    href={link.href}
                    className="hover:text-primary transition-colors"
                  >
                    {t(link.label)}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="lg:col-span-2">
            <h4 className="text-foreground font-semibold mb-6">
              {t("newsletter_title")}
            </h4>
            <p className="text-muted-foreground mb-6 text-sm">
              {t("newsletter_desc")}
            </p>
            <form
              className="relative flex items-center w-full group"
              onSubmit={async (e) => {
                e.preventDefault()
                if (isLoading) return

                const form = e.target as HTMLFormElement
                const emailInput = form.elements.namedItem(
                  "email"
                ) as HTMLInputElement
                const email = emailInput.value

                if (!email) return

                setIsLoading(true)
                try {
                  const res = await fetch("/api/newsletter", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                  })

                  const data = await res.json()

                  if (res.ok) {
                    toast.success(
                      data.message
                        ? t(data.message as any)
                        : t("subscribe_success")
                    )
                    emailInput.value = ""
                  } else {
                    toast.error(
                      data.error ? t(data.error as any) : t("subscribe_error")
                    )
                  }
                } catch {
                  toast.error(t("server_error"))
                } finally {
                  setIsLoading(false)
                }
              }}
            >
              <Input
                name="email"
                type="email"
                required
                disabled={isLoading}
                placeholder={t("email_placeholder")}
                className="h-11 w-full ps-5 pe-12 rounded-full bg-secondary/30 border-border/50 hover:border-primary/50 focus-visible:bg-background focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary transition-all duration-300 disabled:opacity-50 text-sm shadow-sm"
              />
              <Button
                size="icon"
                type="submit"
                aria-label={t("subscribe") || "Subscribe to newsletter"}
                disabled={isLoading}
                className="absolute end-1 w-9 h-9 rounded-full shadow-sm transition-transform duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 rtl:-scale-x-100" />
                )}
                <span className="sr-only">
                  {isLoading ? t("subscribing") : t("subscribe")}
                </span>
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {brandName}. {copyright}
          </p>
          <div className="flex gap-6 flex-wrap justify-center">
            {FOOTER_SECTIONS.legal.links.map((link, idx) => (
              <LocalizedClientLink
                key={idx}
                href={link.href}
                className="hover:text-foreground transition-colors"
              >
                {t(link.label)}
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterStyle1

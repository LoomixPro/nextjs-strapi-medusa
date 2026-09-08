"use client"

import React, { useState } from "react"
import { Send, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FOOTER_SECTIONS } from "../../constants"
import { Button } from "@modules/common/components/shadcn/button"
import { Input } from "@modules/common/components/shadcn/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { FooterStyleComponentProps, SOCIAL_ICONS } from "../../shared"
import { FooterLogo } from "../../logo"
import { useTranslations } from "next-intl"

const FooterStyle2: React.FC<FooterStyleComponentProps> = ({
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
  const [year, setYear] = useState<number | null>(null)

  React.useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])
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
    <footer className="relative overflow-hidden bg-card text-card-foreground border-t border-border pt-8 pb-16 md:pb-8 px-4 md:px-8 transition-colors duration-500 z-10">
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-1/4 left-10 w-[500px] h-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[120px] mix-blend-screen animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-1/4 right-10 w-[400px] h-[400px] rounded-full bg-accent/5 dark:bg-accent/10 blur-[100px] mix-blend-screen animate-pulse"
          style={{ animationDuration: "12s" }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          {/* Bento Cell 1: Brand Pitch & CTA (col-span-7) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-5 md:p-6 rounded-[2rem] bg-background/50 border border-border/60 backdrop-blur-md transition-all duration-300 hover:shadow-lg dark:hover:shadow-primary/10">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="inline-block">
                  <FooterLogo
                    logoLight={logoLight}
                    logoDark={logoDark}
                    logo={logo}
                    textClassName="text-foreground text-3xl"
                  />
                </div>
                {/* Modern Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/10 w-fit">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{t("active_support")}</span>
                </div>
              </div>

              <p className="text-lg md:text-xl font-light text-muted-foreground leading-relaxed max-w-2xl">
                {description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80">
                {t("discover_more") || "Elevate your everyday"}
              </span>
              <LocalizedClientLink href="/store" className="inline-flex">
                <Button className="group rounded-2xl h-10 px-6 transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center">
                  <span>{t("store")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-300" />
                </Button>
              </LocalizedClientLink>
            </div>
          </div>

          {/* Bento Cell 2: Newsletter Box (col-span-5) */}
          <div className="lg:col-span-5 p-5 md:p-6 rounded-[2rem] bg-gradient-to-br from-primary/5 via-background to-accent/5 border border-border/60 backdrop-blur-md flex flex-col justify-between transition-all duration-300 hover:shadow-lg">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-primary mb-2 block">
                {t("newsletter_tag") || "NEWSLETTER"}
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight leading-tight mb-3">
                {t("newsletter_title")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {t("newsletter_desc")}
              </p>
            </div>

            <form
              className="space-y-3"
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
              <div className="relative group">
                <Input
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder={t("email_placeholder")}
                  className="w-full h-10 px-5 rounded-xl bg-background/80 border-border focus-visible:ring-primary focus-visible:border-primary text-foreground placeholder:text-muted-foreground transition-all duration-300 disabled:opacity-50"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-10 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <span>{isLoading ? t("subscribing") : t("subscribe")}</span>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Second Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 mb-6">
          {/* Shop Column (col-span-4) */}
          <div className="lg:col-span-4 p-5 rounded-[2rem] bg-background/50 border border-border/50 backdrop-blur-sm">
            <h4 className="text-foreground font-bold mb-4 text-sm tracking-wider uppercase border-b border-border/50 pb-2">
              {t(FOOTER_SECTIONS.product.title)}
            </h4>
            <ul className="space-y-2">
              {shopLinks.map((link, idx) => (
                <li key={idx}>
                  <LocalizedClientLink
                    href={link.href}
                    className="group flex items-center justify-between py-1 text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    <span className="group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-transform duration-300 text-[15px] font-medium">
                      {link.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300" />
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column (col-span-4) */}
          <div className="lg:col-span-4 p-5 rounded-[2rem] bg-background/50 border border-border/50 backdrop-blur-sm">
            <h4 className="text-foreground font-bold mb-4 text-sm tracking-wider uppercase border-b border-border/50 pb-2">
              {t(FOOTER_SECTIONS.company.title)}
            </h4>
            <ul className="space-y-2">
              {FOOTER_SECTIONS.company.links.map((link, idx) => (
                <li key={idx}>
                  <LocalizedClientLink
                    href={link.href}
                    className="group flex items-center justify-between py-1 text-muted-foreground hover:text-primary transition-all duration-300"
                  >
                    <span className="group-hover:translate-x-1.5 rtl:group-hover:-translate-x-1.5 transition-transform duration-300 text-[15px] font-medium">
                      {t(link.label)}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all duration-300" />
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Bento Column (col-span-4) */}
          <div className="lg:col-span-4 p-5 rounded-[2rem] bg-background/50 border border-border/50 backdrop-blur-sm flex flex-col justify-between">
            <div>
              <h4 className="text-foreground font-bold mb-4 text-sm tracking-wider uppercase border-b border-border/50 pb-2">
                {t("social_title")}
              </h4>

              {activeSocialLinks.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {activeSocialLinks.map((social, idx) => {
                    const platform = social.platform
                    // Colors mapping for platform hover state
                    const hoverColors: Record<string, string> = {
                      twitter: "hover:bg-[#1da1f2] hover:border-[#1da1f2]",
                      github: "hover:bg-[#24292e] hover:border-[#24292e]",
                      linkedin: "hover:bg-[#0077b5] hover:border-[#0077b5]",
                      facebook: "hover:bg-[#1877f2] hover:border-[#1877f2]",
                      instagram:
                        "hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:border-transparent",
                      youtube: "hover:bg-[#ff0000] hover:border-[#ff0000]",
                      telegram: "hover:bg-[#0088cc] hover:border-[#0088cc]",
                      whatsapp: "hover:bg-[#25d366] hover:border-[#25d366]",
                    }
                    const hoverColor =
                      hoverColors[platform] ||
                      "hover:bg-primary hover:border-primary"
                    const iconNode = SOCIAL_ICONS[platform]
                    if (!iconNode) return null
                    return (
                      <a
                        key={idx}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center p-2 rounded-xl bg-background border border-border transition-all duration-300 group shadow-sm ${hoverColor}`}
                        title={platform}
                      >
                        <div className="text-muted-foreground group-hover:text-primary-foreground transition-colors duration-300">
                          {React.cloneElement(
                            iconNode as React.ReactElement<{
                              className?: string
                            }>,
                            {
                              className:
                                "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                            }
                          )}
                        </div>
                      </a>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No social links configured.
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground font-medium">
              {t("social_follow_desc")}
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="pt-2 border-t border-border/80 flex flex-col md:flex-row justify-between items-center gap-6 text-[13px] text-muted-foreground font-medium">
          <p>
            © {year} {brandName}. {copyright}
          </p>
          <div className="flex gap-6 flex-wrap justify-center">
            {FOOTER_SECTIONS.legal.links.map((link, idx) => (
              <LocalizedClientLink
                key={idx}
                href={link.href}
                className="hover:text-foreground transition-colors duration-200"
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

export default FooterStyle2

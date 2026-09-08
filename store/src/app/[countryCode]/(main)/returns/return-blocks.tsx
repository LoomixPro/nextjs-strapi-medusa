"use client"

import React from "react"
import { Card, CardContent } from "@modules/common/components/shadcn/card"
import { Badge } from "@modules/common/components/shadcn/badge"
import { Button } from "@modules/common/components/shadcn/button"
import { Separator } from "@modules/common/components/shadcn/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@modules/common/components/shadcn/accordion"
import {
  Clock,
  Truck,
  DollarSign,
  RefreshCw,
  FileText,
  CheckCircle2,
  Package,
  XCircle,
  AlertCircle,
  Mail,
  HelpCircle,
  Info,
  Phone,
  MessageCircle,
  LucideIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  ReturnPageBlock,
  ReturnHeroBlock,
  ReturnSectionGridBlock,
} from "@lib/data/strapi-pages"

const iconMap: Record<string, LucideIcon> = {
  Clock,
  Truck,
  DollarSign,
  RefreshCw,
  FileText,
  CheckCircle2,
  Package,
  XCircle,
  AlertCircle,
  Mail,
}

const getIcon = (iconName: string | undefined) => {
  if (!iconName || !iconMap[iconName]) return HelpCircle
  return iconMap[iconName]
}

export default function ReturnBlocks({
  blocks,
  updatedAt,
  locale,
}: {
  blocks: ReturnPageBlock[]
  updatedAt: string
  locale: string
}) {
  const t = useTranslations("Common")

  // Find the hero section block
  const heroBlock = blocks.find(
    (b): b is ReturnHeroBlock => b.__component === "support.return-hero"
  )

  // Compile navigation links dynamically from section-grid blocks
  const navigationLinks = blocks
    .filter(
      (b): b is ReturnSectionGridBlock =>
        b.__component === "support.section-grid" && !!b.section_id && !!b.title
    )
    .map((b) => ({
      id: b.id,
      label: b.title,
      target_section: b.section_id,
    }))

  const contentBlocks = blocks.filter(
    (b) => b.__component !== "support.return-hero"
  )

  const renderMarkdown = (content: string) => {
    if (!content) return null
    return content.split("\n").map((paragraph, index) => (
      <p key={index} className="mb-2 last:mb-0 leading-relaxed">
        {paragraph}
      </p>
    ))
  }

  const renderBlock = (block: ReturnPageBlock) => {
    switch (block.__component) {
      case "support.section-grid": {
        const IconComponent = getIcon(block.icon)
        return (
          <div id={block.section_id} className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <IconComponent className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold m-0">
                {block.title}
              </h2>
            </div>

            {block.intro_text && (
              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-wrap">
                {block.intro_text}
              </p>
            )}

            {block.cards && block.cards.length > 0 && (
              <div className="grid md:grid-cols-3 gap-6">
                {block.cards.map((card, cardIdx) => {
                  const CardIcon = getIcon(card.icon)
                  return (
                    <Card
                      key={card.id || cardIdx}
                      className="hover:shadow-md transition-shadow border border-border/40 bg-card"
                    >
                      <CardContent className="pt-6 space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <CardIcon className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base text-foreground">
                          {card.title}
                        </h3>
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {renderMarkdown(card.description)}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {block.footer_text && (
              <Card className="bg-primary/5 border border-primary/20 mt-6 rounded-2xl">
                <CardContent className="p-6 flex gap-3 items-start">
                  <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground leading-relaxed">
                    {renderMarkdown(block.footer_text)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      }

      case "support.return-faq": {
        return (
          <div className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold m-0">
                {block.faq_title}
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-3">
              {block.faq_items?.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={`faq-${item.id}`}
                  className="border rounded-2xl px-5 bg-card border-border/40 hover:bg-accent/5 transition-colors"
                >
                  <AccordionTrigger className="hover:no-underline py-4 text-base font-semibold">
                    <span className="text-start">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4 leading-relaxed whitespace-pre-wrap text-sm">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )
      }

      case "support.contact-cta": {
        const IconComponent = getIcon(block.icon)
        return (
          <div id="contact" className="scroll-mt-24">
            <Card className="bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 border border-primary/20 rounded-3xl overflow-hidden relative">
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

              <CardContent className="flex flex-col items-center text-center p-8 md:p-12 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <IconComponent className="w-8 h-8" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-3">
                  {block.title}
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl leading-relaxed text-sm md:text-base">
                  {block.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  {/* Primary Button */}
                  {block.button_link.startsWith("/") ? (
                    <LocalizedClientLink
                      href={block.button_link}
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                        {block.button_text}
                      </Button>
                    </LocalizedClientLink>
                  ) : (
                    <a
                      href={block.button_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                        {block.button_text}
                      </Button>
                    </a>
                  )}

                  {/* Secondary Button */}
                  {block.secondary_button_link &&
                    block.secondary_button_text &&
                    (block.secondary_button_link.startsWith("/") ? (
                      <LocalizedClientLink
                        href={block.secondary_button_link}
                        className="w-full sm:w-auto"
                      >
                        <Button className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center">
                          <Phone className="w-4 h-4" />
                          {block.secondary_button_text}
                        </Button>
                      </LocalizedClientLink>
                    ) : (
                      <a
                        href={block.secondary_button_link}
                        className="w-full sm:w-auto"
                      >
                        <Button className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center">
                          <Phone className="w-4 h-4" />
                          {block.secondary_button_text}
                        </Button>
                      </a>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="w-full text-foreground">
      {/* Hero Section */}
      {heroBlock && (
        <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border/40 text-center">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            {heroBlock.badge && (
              <Badge
                className="mb-6 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full"
                variant="secondary"
              >
                {heroBlock.badge}
              </Badge>
            )}
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
              {heroBlock.title}
            </h1>
            <div className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {renderMarkdown(heroBlock.description)}
            </div>
            {heroBlock.button_text && heroBlock.button_link && (
              <div className="mt-8">
                {heroBlock.button_link.startsWith("/") ? (
                  <LocalizedClientLink href={heroBlock.button_link}>
                    <Button className="rounded-xl py-4 font-bold shadow-md shadow-primary/20">
                      {heroBlock.button_text}
                    </Button>
                  </LocalizedClientLink>
                ) : (
                  <a href={heroBlock.button_link}>
                    <Button className="rounded-xl py-4 font-bold shadow-md shadow-primary/20">
                      {heroBlock.button_text}
                    </Button>
                  </a>
                )}
              </div>
            )}
            {updatedAt && (
              <p className="text-xs text-muted-foreground/60 mt-6 flex items-center justify-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                {t("lastUpdated")}:{" "}
                {new Date(updatedAt).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Quick Navigation Sticky Bar */}
      {navigationLinks.length > 0 && (
        <section className="py-4 bg-muted/30 z-10 border-b backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 no-scrollbar">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground flex-shrink-0 ml-2">
                {t("jumpTo")}
              </span>
              <div className="flex items-center gap-6">
                {navigationLinks.map((item, idx) => (
                  <a
                    key={`${item.target_section}-${idx}`}
                    href={`#${item.target_section}`}
                    className="text-primary hover:text-primary/80 transition-colors whitespace-nowrap font-medium"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content Sections */}
      <section className="py-12 md:py-20 container mx-auto px-4 max-w-4xl">
        <div className="space-y-16">
          {contentBlocks.map((block, idx) => {
            const isFirst = idx === 0
            return (
              <React.Fragment key={`${block.__component}-${block.id || idx}`}>
                {!isFirst && <Separator className="my-12 border-border/40" />}
                <div className="animate-fade-in-up">{renderBlock(block)}</div>
              </React.Fragment>
            )
          })}
        </div>
      </section>
    </div>
  )
}

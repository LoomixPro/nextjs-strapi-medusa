"use client"

import React from "react"
import { Card, CardContent } from "@modules/common/components/shadcn/card"
import { Badge } from "@modules/common/components/shadcn/badge"
import { Button } from "@modules/common/components/shadcn/button"
import { Separator } from "@modules/common/components/shadcn/separator"
import {
  Shield,
  Lock,
  Eye,
  UserCheck,
  Mail,
  Cookie,
  Globe,
  FileText,
} from "lucide-react"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    Shield,
    Lock,
    Eye,
    UserCheck,
    Mail,
    Cookie,
    Globe,
    FileText,
  }
  return icons[iconName] || FileText
}

export default function PrivacyBlocks({
  blocks,
  updatedAt,
  locale,
}: {
  blocks: any[]
  updatedAt: string
  locale: string
}) {
  const t = useTranslations("Common")

  // Find the hero section block
  const heroBlock = blocks.find(
    (b: any) => b.__component === "privacy.privacy-hero"
  )

  // Compile navigation links dynamically from blocks that have a section_id and title
  const navigationLinks = blocks
    .filter((b: any) => b.section_id && b.title)
    .map((b: any) => ({
      id: b.id,
      label: b.title,
      target_section: b.section_id,
    }))

  const contentBlocks = blocks.filter(
    (b: any) => b.__component !== "privacy.privacy-hero"
  )

  const renderBlock = (block: any) => {
    switch (block.__component) {
      case "privacy.privacy-card-section": {
        const IconComponent = getIcon(block.icon)
        return (
          <div id={block.section_id} className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <IconComponent className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold m-0">{block.title}</h2>
            </div>
            <Card className="border border-border/40">
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {block.content}
                </p>
              </CardContent>
            </Card>
          </div>
        )
      }

      case "privacy.privacy-grid-section": {
        const IconComponent = getIcon(block.icon)

        const renderFooter = () => {
          if (!block.footer_text) return null

          if (block.layout_style === "alert") {
            return (
              <Card className="bg-primary/5 border border-primary/25 mt-4">
                <CardContent>
                  <p className="text-sm font-medium text-primary leading-relaxed whitespace-pre-wrap">
                    {block.footer_text}
                  </p>
                </CardContent>
              </Card>
            )
          } else if (block.layout_style === "muted") {
            return (
              <Card className="bg-muted/50 border border-border/30 mt-4">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {block.footer_text}
                  </p>
                </CardContent>
              </Card>
            )
          } else {
            return (
              <p className="text-muted-foreground mt-4 leading-relaxed whitespace-pre-wrap">
                {block.footer_text}
              </p>
            )
          }
        }

        return (
          <div id={block.section_id} className="mb-12 scroll-mt-24">
            <div className="flex items-center gap-3 mb-4">
              <IconComponent className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold mt-6">{block.title}</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">{block.intro_text}</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {block.cards?.map((card: any, cardIdx: number) => (
                  <Card
                    key={card.id || cardIdx}
                    className="h-full hover:shadow-md transition-shadow border border-border/40"
                  >
                    <CardContent>
                      <h3 className="font-semibold text-primary">
                        {card.title}
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {card.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {renderFooter()}
            </div>
          </div>
        )
      }

      case "privacy.privacy-text-section": {
        return (
          <div id={block.section_id} className="mb-12 scroll-mt-24">
            <h2 className="text-2xl font-bold mt-6 mb-3">{block.title}</h2>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed mb-4">
              {block.content}
            </p>
          </div>
        )
      }

      case "privacy.privacy-contact-cta": {
        const IconComponent = getIcon(block.icon)
        return (
          <div id="contact" className="scroll-mt-24">
            <Card className="bg-primary/5 border border-primary/20">
              <CardContent className="flex flex-col items-center text-center p-8">
                <IconComponent className="w-12 h-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
                <p className="text-muted-foreground mb-6 max-w-md leading-relaxed text-sm">
                  {block.description}
                </p>
                <LocalizedClientLink href={block.button_link}>
                  <Button size="lg" className="font-semibold">
                    {block.button_text}
                  </Button>
                </LocalizedClientLink>
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
    <div className="w-full">
      {/* Hero Section */}
      {heroBlock && (
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/5 to-background border-b text-center">
          <div className="container mx-auto px-4 max-w-4xl">
            <Badge className="mb-4" variant="outline">
              {heroBlock.badge}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {heroBlock.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("lastUpdated")}:{" "}
              {new Date(updatedAt).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </section>
      )}

      {/* Quick Navigation */}
      {navigationLinks.length > 0 && (
        <section className="py-8 bg-muted/30 z-10 border-b">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground flex-shrink-0">
                {t("jumpTo")}
              </span>
              {navigationLinks.map((item, idx) => (
                <a
                  key={`${item.target_section}-${idx}`}
                  href={`#${item.target_section}`}
                  className="text-primary hover:underline whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-12 md:py-16 container mx-auto px-4 max-w-4xl">
        <div className="space-y-0">
          {contentBlocks.map((block: any, idx: number) => {
            const isFirst = idx === 0
            return (
              <React.Fragment key={`${block.__component}-${block.id || idx}`}>
                {!isFirst && <Separator className="my-12" />}
                {renderBlock(block)}
              </React.Fragment>
            )
          })}
        </div>
      </section>
    </div>
  )
}

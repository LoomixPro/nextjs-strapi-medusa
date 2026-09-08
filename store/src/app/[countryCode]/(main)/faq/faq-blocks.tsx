"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@modules/common/components/shadcn/card"
import { Badge } from "@modules/common/components/shadcn/badge"
import { Input } from "@modules/common/components/shadcn/input"
import { Button } from "@modules/common/components/shadcn/button"
import { Separator } from "@modules/common/components/shadcn/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@modules/common/components/shadcn/accordion"
import {
  Search,
  Package,
  RefreshCw,
  ShoppingBag,
  User,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  FAQPageBlock,
  FAQCategoryBlock,
  FAQHeroBlock,
  FAQContactCtaBlock,
} from "@lib/data/strapi-pages"

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    ShoppingBag,
    Package,
    RefreshCw,
    User,
    Mail,
    Phone,
    MessageCircle,
    HelpCircle,
  }
  return icons[iconName] || HelpCircle
}

export default function FAQBlocks({ blocks }: { blocks: FAQPageBlock[] }) {
  const t = useTranslations("FAQ")
  const [searchQuery, setSearchQuery] = useState("")

  const heroBlock = blocks.find(
    (b): b is FAQHeroBlock => b.__component === "faq.faq-hero"
  )
  const categories = blocks.filter(
    (b): b is FAQCategoryBlock => b.__component === "faq.faq-category"
  )
  const contactCta = blocks.find(
    (b): b is FAQContactCtaBlock => b.__component === "faq.faq-contact-cta"
  )

  // Filter questions based on search
  const filterQuestions = (category: FAQCategoryBlock) => {
    if (!searchQuery) return category.questions
    return category.questions.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const hasAnyResults = categories.some(
    (category) => filterQuestions(category).length > 0
  )

  return (
    <div className="w-full">
      {/* Hero Section */}
      {heroBlock && (
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/5 to-background border-b">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Badge className="mb-4" variant="outline">
              {heroBlock.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
              {heroBlock.title}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {heroBlock.description}
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute end-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder={heroBlock.searchPlaceholder || "Search..."}
                  className="pe-12 ps-4 h-12 text-base rounded-2xl border border-border/40"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Navigation */}
      {categories.length > 0 && (
        <section className="py-4 bg-muted/30 sticky top-0 z-10 border-b backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center gap-2 text-sm overflow-x-auto pb-2 no-scrollbar">
              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground flex-shrink-0 ml-2">
                {t("quickAccess")}
              </span>
              <div className="flex items-center gap-6">
                {categories.map((category) => (
                  <a
                    key={category.id}
                    href={`#${category.anchor_id}`}
                    className="text-primary hover:text-primary/80 transition-colors whitespace-nowrap font-medium"
                  >
                    {category.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Content */}
      <section className="py-12 container mx-auto px-4 max-w-4xl">
        {categories.map((category, index) => {
          const Icon = getIcon(category.icon)
          const filteredQuestions = filterQuestions(category)

          // Hide category if no matching questions in search
          if (searchQuery && filteredQuestions.length === 0) return null

          return (
            <div key={category.id} className="mb-12">
              <div id={category.anchor_id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                </div>

                <Accordion
                  type="single"
                  collapsible
                  className="w-full space-y-2"
                >
                  {filteredQuestions.map((item) => (
                    <AccordionItem
                      key={item.id}
                      value={`${category.id}-${item.id}`}
                      className="border rounded-xl px-4 bg-card border-border/40"
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
              {index < categories.length - 1 && <Separator className="my-12" />}
            </div>
          )
        })}

        {/* No Results Message */}
        {searchQuery && !hasAnyResults && (
          <Card className="text-center py-12 border-border/40">
            <CardContent>
              <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t("noResults")}</h3>
              <p className="text-muted-foreground mb-4">
                {t("noResultsDetail", { query: searchQuery })}
              </p>
              <Button
                onClick={() => setSearchQuery("")}
                variant="outline"
                className="rounded-xl"
              >
                {t("clearSearch")}
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Still Need Help Section */}
      {contactCta && (
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                {(() => {
                  const ContactIcon = getIcon(contactCta.icon)
                  return <ContactIcon className="w-6 h-6 text-primary" />
                })()}
              </div>
              <h2 className="text-3xl font-bold mb-4">{contactCta.title}</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed max-w-lg mx-auto">
                {contactCta.description}
              </p>
              <LocalizedClientLink href={contactCta.button_link}>
                <Button className="font-semibold rounded-xl px-8 py-4">
                  {contactCta.button_text}
                </Button>
              </LocalizedClientLink>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

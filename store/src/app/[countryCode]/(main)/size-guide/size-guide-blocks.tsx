"use client"

import React, { useState } from "react"
import Image from "next/image"
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
  Ruler,
  HelpCircle,
  Info,
  Phone,
  MessageCircle,
  CheckCircle2,
  Table,
  ZoomIn,
} from "lucide-react"
import { useTranslations } from "next-intl"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BlocksRenderer } from "@strapi/blocks-react-renderer"
import Modal from "@modules/common/components/modal"
import {
  SizeGuidePageBlock,
  SizeGuideHeroBlock,
  SizeGuideImportantNoticeBlock,
  SizeGuideMeasurementBlock,
  SizeGuideChartsBlock,
  SizeGuideFAQBlock,
  SizeGuideContactCTABlock,
} from "@lib/data/strapi-pages"

const STRAPI_URL =
  process.env.STRAPI_URL ||
  process.env.NEXT_PUBLIC_STRAPI_URL ||
  "http://localhost:1337"

export default function SizeGuideBlocks({
  blocks,
  updatedAt,
  locale,
}: {
  blocks: SizeGuidePageBlock[]
  updatedAt: string
  locale: string
}) {
  const t = useTranslations("Common")
  const [activeImage, setActiveImage] = useState<{
    src: string
    title: string
  } | null>(null)

  // Find the hero section block
  const heroBlock = blocks.find(
    (b): b is SizeGuideHeroBlock => b.__component === "guide.guide-hero"
  )

  const contentBlocks = blocks.filter(
    (b) => b.__component !== "guide.guide-hero"
  )

  return (
    <div className="w-full text-foreground">
      {/* Hero Section */}
      {heroBlock && (
        <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background border-b border-border/40">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 translate-x-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <Badge
              className="mb-6 px-4 py-1.5 text-xs font-semibold tracking-wide rounded-full"
              variant="secondary"
            >
              {heroBlock.badge}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-primary">
              {heroBlock.title}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {heroBlock.description}
            </p>
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

      {/* Main Content Sections */}
      <section className="py-12 md:py-20 container mx-auto px-4 max-w-4xl">
        <div className="space-y-16">
          {contentBlocks.map((block, idx) => (
            <div
              key={`${block.__component}-${block.id || idx}`}
              className="animate-fade-in-up"
            >
              <RenderBlock
                block={block}
                onZoom={(src, title) => setActiveImage({ src, title })}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal */}
      <Modal
        isOpen={!!activeImage}
        close={() => setActiveImage(null)}
        size="large"
      >
        {activeImage && (
          <div className="flex flex-col w-full">
            <Modal.Title>{activeImage.title}</Modal.Title>
            <Modal.Body>
              <div className="relative w-full aspect-[4/3] max-h-[70vh] bg-white dark:bg-zinc-950 rounded-2xl overflow-hidden border flex items-center justify-center p-2">
                <Image
                  src={activeImage.src}
                  alt={activeImage.title}
                  className="object-contain"
                  fill
                  sizes="(max-width: 1024px) 100vw, 900px"
                  unoptimized={activeImage.src.includes(
                    "body_measurement_guide.png"
                  )}
                />
              </div>
            </Modal.Body>
          </div>
        )}
      </Modal>
    </div>
  )
}

function RenderBlock({
  block,
  onZoom,
}: {
  block: SizeGuidePageBlock
  onZoom: (src: string, title: string) => void
}) {
  switch (block.__component) {
    case "guide.guide-important-notice":
      return <ImportantNoticeBlock block={block} />

    case "guide.guide-measurement":
      return <MeasurementBlock block={block} onZoom={onZoom} />

    case "guide.guide-charts":
      return <ChartsBlock block={block} onZoom={onZoom} />

    case "guide.guide-faq":
      return <FAQBlock block={block} />

    case "guide.guide-contact-cta":
      return <ContactCtaBlock block={block} />

    default:
      return null
  }
}

// 1. Important Notice Block
function ImportantNoticeBlock({
  block,
}: {
  block: SizeGuideImportantNoticeBlock
}) {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-amber-500/5 border border-amber-500/25 text-amber-900 dark:text-amber-200">
      <div className="flex gap-4 items-start">
        <div className="p-2 bg-amber-500/10 rounded-2xl text-amber-500 flex-shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-2 text-sm md:text-base leading-relaxed">
          <BlocksRenderer content={block.content} />
        </div>
      </div>
    </div>
  )
}

// 2. Measurement Instructions Block
function MeasurementBlock({
  block,
  onZoom,
}: {
  block: SizeGuideMeasurementBlock
  onZoom: (src: string, title: string) => void
}) {
  return (
    <div className="space-y-12">
      {/* Title */}
      <div className="text-center md:text-right">
        <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 justify-center md:justify-start">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Ruler className="w-4 h-4" />
          </div>
          {block.how_to_measure_title}
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Left/Right Column: Steps */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-muted-foreground/80 mb-4 px-1">
            {block.measurement_instructions_title}
          </h3>
          <div className="space-y-4">
            {block.measurement_steps?.map((step) => (
              <div
                key={step.id}
                className="flex gap-4 p-5 rounded-2xl border border-border/40 bg-card hover:bg-accent/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {step.step_number}
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-base">{step.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column: Tips & Visual Guide */}
        <div className="space-y-8 bg-muted/30 p-6 md:p-8 rounded-3xl border border-border/30">
          <div>
            <h3 className="text-lg font-bold text-muted-foreground/80 mb-4">
              {block.measurement_tips_title}
            </h3>
            <ul className="space-y-3">
              {block.measurement_tips?.map((tip) => (
                <li
                  key={tip.id}
                  className="flex gap-3 items-start text-sm md:text-base text-muted-foreground"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{tip.tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-border/60" />

          {/* Visual Diagram */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-base">
                {block.visual_guide_title}
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                {block.visual_guide_description}
              </p>
            </div>

            {/* Render Visual Guide Image fetched statically */}
            <div
              onClick={() =>
                onZoom(
                  `${STRAPI_URL}/body_measurement_guide.png`,
                  block.visual_guide_title
                )
              }
              className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-border/40 bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner mt-4 group cursor-zoom-in"
            >
              <Image
                src={`${STRAPI_URL}/body_measurement_guide.png`}
                alt={block.visual_guide_title}
                className="object-contain p-4 group-hover:scale-[1.03] transition-transform duration-300"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. Size Charts Block
function ChartsBlock({
  block,
  onZoom,
}: {
  block: SizeGuideChartsBlock
  onZoom: (src: string, title: string) => void
}) {
  const [activeCategory, setActiveCategory] = useState(
    block.size_categories?.[0]?.category_value || ""
  )

  const activeCatData = block.size_categories?.find(
    (cat) => cat.category_value === activeCategory
  )

  return (
    <div className="space-y-8">
      {/* Block Title */}
      <div className="text-center md:text-start">
        <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 justify-center md:justify-start">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Table className="w-4 h-4" />
          </div>
          {block.size_charts_title}
        </h2>
      </div>

      {/* Tabs Container */}
      <div className="space-y-6">
        <div className="flex border-b border-border/40 gap-4 overflow-x-auto pb-px">
          {block.size_categories?.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.category_value)}
              className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all px-2 whitespace-nowrap ${
                activeCategory === category.category_value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {category.category_name}
            </button>
          ))}
        </div>

        {/* Sizing Charts Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {activeCatData?.charts?.map((chart) => {
            // Handle image path correctly
            const imageUrl = chart.image?.url
              ? chart.image.url.startsWith("http")
                ? chart.image.url
                : `${STRAPI_URL}${chart.image.url}`
              : null

            return (
              <Card
                key={chart.id}
                className="overflow-hidden border border-border/40 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">
                      {chart.title}
                    </h3>
                    {chart.description && (
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {chart.description}
                      </p>
                    )}
                  </div>

                  {imageUrl && (
                    <div
                      onClick={() => onZoom(imageUrl, chart.title)}
                      className="relative aspect-[4/3] w-full rounded-xl overflow-hidden border bg-white dark:bg-slate-800 flex items-center justify-center group cursor-zoom-in"
                    >
                      <Image
                        src={imageUrl}
                        alt={chart.title}
                        className="object-contain p-2 group-hover:scale-[1.03] transition-transform duration-300"
                        fill
                        sizes="(max-width: 768px) 100vw, 400px"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 drop-shadow-md" />
                      </div>
                    </div>
                  )}

                  {chart.image_description && (
                    <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground leading-relaxed">
                      {chart.image_description}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// 4. FAQ Block
function FAQBlock({ block }: { block: SizeGuideFAQBlock }) {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center md:text-start">
        <h2 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 justify-center md:justify-start">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <HelpCircle className="w-4 h-4" />
          </div>
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

// 5. Contact CTA Block
function ContactCtaBlock({ block }: { block: SizeGuideContactCTABlock }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-transparent to-indigo-500/5 border border-primary/20 rounded-3xl overflow-hidden relative">
      {/* Glow */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />

      <CardContent className="flex flex-col items-center text-center p-8 md:p-12 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          <MessageCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-3">{block.title}</h2>
        <p className="text-muted-foreground mb-8 max-w-xl leading-relaxed text-sm md:text-base">
          {block.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          {/* Primary Button */}
          {block.primary_button_link.startsWith("/") ? (
            <LocalizedClientLink
              href={block.primary_button_link}
              className="w-full sm:w-auto"
            >
              <Button className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center">
                <MessageCircle className="w-5 h-5" />
                {block.primary_button_text}
              </Button>
            </LocalizedClientLink>
          ) : (
            <a
              href={block.primary_button_link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="lg"
                className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center"
              >
                <MessageCircle className="w-5 h-5" />
                {block.primary_button_text}
              </Button>
            </a>
          )}

          {/* Secondary Button */}
          {block.secondary_button_link.startsWith("/") ? (
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
            <a href={block.secondary_button_link} className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full px-8 py-4 rounded-xl font-bold shadow-md shadow-primary/20 flex gap-2 items-center justify-center"
              >
                <Phone className="w-4 h-4" />
                {block.secondary_button_text}
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

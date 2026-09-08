import React from "react"
import { Card, CardContent } from "@modules/common/components/shadcn/card"
import { Badge } from "@modules/common/components/shadcn/badge"
import { Button } from "@modules/common/components/shadcn/button"
import { Sparkles, Target, Heart, Truck, Shield, Clock } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { AboutPageBlock } from "@lib/data/strapi-pages"

const iconMap = {
  Sparkles,
  Target,
  Heart,
  Truck,
  Shield,
  Clock,
}

export default function AboutBlocks({ blocks }: { blocks: AboutPageBlock[] }) {
  return (
    <div className="space-y-0">
      {blocks.map((block) => {
        switch (block.__component) {
          case "about.about-hero":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background"
              >
                <div className="container mx-auto px-4 text-center">
                  <Badge className="mb-6" variant="outline">
                    {block.badge}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-5">
                    {block.title}
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                    {block.description}
                  </p>
                </div>
              </section>
            )

          case "about.about-story":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="py-16 md:py-24 container mx-auto px-4"
              >
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                      {block.title}
                    </h2>
                  </div>
                  <div className="space-y-5 text-base md:text-lg text-muted-foreground/90 leading-relaxed font-light">
                    {block.paragraphs
                      .split("\n\n")
                      .map((p: string, i: number) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                </div>
              </section>
            )

          case "about.about-values":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="py-16 bg-muted/30"
              >
                <div className="container mx-auto px-4">
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Target className="w-8 h-8 text-primary" />
                      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
                        {block.title}
                      </h2>
                    </div>
                    {block.subtitle && (
                      <p className="text-base text-muted-foreground max-w-xl mx-auto font-light">
                        {block.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {block.items?.map((item, idx) => (
                      <Card
                        key={item.id || idx}
                        className="hover:shadow-md transition-all border border-border/40"
                      >
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-2">
                            {item.title}
                          </h3>
                          <p className="text-sm md:text-base text-muted-foreground/80 leading-relaxed">
                            {item.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>
            )

          case "about.about-features":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="py-16 md:py-24 container mx-auto px-4"
              >
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-semibold mb-10 text-center tracking-tight">
                    {block.title}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {block.items?.map((feature, idx) => {
                      const Icon = feature.icon_name
                        ? iconMap[feature.icon_name as keyof typeof iconMap]
                        : Sparkles
                      return (
                        <div key={feature.id || idx} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium mb-1.5">
                              {feature.title}
                            </h3>
                            <p className="text-sm md:text-base text-muted-foreground/80">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </section>
            )

          case "about.about-promise":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="py-16 bg-muted/30"
              >
                <div className="container mx-auto px-4">
                  <Card className="max-w-4xl mx-auto border-2">
                    <CardContent className="py-12 px-6 md:px-12">
                      <h2 className="text-2xl font-semibold mb-5 text-center tracking-tight">
                        {block.title}
                      </h2>
                      <div className="space-y-4 text-base md:text-lg text-muted-foreground/80 leading-relaxed font-light">
                        {block.paragraphs
                          .split("\n\n")
                          .map((p: string, i: number) => (
                            <p key={i}>{p}</p>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )

          case "about.about-cta":
            return (
              <section
                key={`${block.__component}-${block.id}`}
                className="py-16 md:py-24 container mx-auto px-4"
              >
                <div className="max-w-3xl mx-auto text-center">
                  <h2 className="text-2xl md:text-3xl font-semibold mb-5 tracking-tight">
                    {block.title}
                  </h2>
                  <p className="text-lg text-muted-foreground mb-6 font-light">
                    {block.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <LocalizedClientLink href={block.primary_button_link}>
                      <Button className="px-8 py-4">
                        {block.primary_button_text}
                      </Button>
                    </LocalizedClientLink>
                    {block.secondary_button_text &&
                      block.secondary_button_link && (
                        <LocalizedClientLink href={block.secondary_button_link}>
                          <Button className="px-8 py-4">
                            {block.secondary_button_text}
                          </Button>
                        </LocalizedClientLink>
                      )}
                  </div>
                </div>
              </section>
            )

          default:
            return null
        }
      })}
    </div>
  )
}

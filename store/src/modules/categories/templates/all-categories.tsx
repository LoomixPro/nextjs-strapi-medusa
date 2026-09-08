"use client"

import React, { useRef } from "react"
import { motion, useInView } from "framer-motion"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import {
  ArrowRight,
  Box,
  Layers,
  Sparkles,
  LayoutGrid,
  Compass,
  Star,
  Zap,
} from "lucide-react"
import { cn } from "@lib/utils"
import { useTranslations } from "next-intl"

type CategoriesTemplateProps = {
  categories?: HttpTypes.StoreProductCategory[]
  navigationData?: any[]
}

const GRADIENTS = [
  "from-indigo-500/30 via-purple-500/30 to-pink-500/30",
  "from-blue-500/30 via-cyan-500/30 to-teal-500/30",
  "from-rose-500/30 via-orange-500/30 to-amber-500/30",
  "from-emerald-500/30 via-green-500/30 to-lime-500/30",
  "from-violet-500/30 via-fuchsia-500/30 to-pink-500/30",
  "from-cyan-500/30 via-blue-500/30 to-indigo-500/30",
]

const ICONS = [Box, Layers, Sparkles, LayoutGrid, Compass, Star, Zap]

export default function AllCategoriesTemplate({
  categories = [],
  navigationData = [],
}: CategoriesTemplateProps) {
  const t = useTranslations("AllCategories")
  // Only display root categories
  const rootCategories = categories.filter((c) => !c.parent_category_id)

  const combinedItems = [
    ...rootCategories.map((c, i) => ({
      id: c.id,
      title: c.name,
      description:
        c.description || t("explore_collection_desc", { category: c.name }),
      href: `/categories/${c.handle}`,
      isCategory: true,
      gradient: GRADIENTS[i % GRADIENTS.length],
      Icon: ICONS[i % ICONS.length],
      children:
        c.category_children?.map((child: any) => ({
          title: child.name,
          href: `/categories/${child.handle}`,
          subChildren:
            child.category_children?.map((subChild: any) => ({
              title: subChild.name,
              href: `/categories/${subChild.handle}`,
            })) || [],
        })) || [],
    })),
    ...navigationData.map((nav, i) => ({
      id: nav.id || `nav-${i}`,
      title: nav.title,
      description: t("discover_more_desc", { title: nav.title }),
      href: nav.path || "/",
      isCategory: false,
      gradient: GRADIENTS[(i + rootCategories.length) % GRADIENTS.length],
      Icon: ICONS[(i + rootCategories.length) % ICONS.length],
      children:
        nav.items?.map((child: any) => ({
          title: child.title,
          href: child.path || "/",
          subChildren:
            child.items?.map((subChild: any) => ({
              title: subChild.title,
              href: subChild.path || "/",
            })) || [],
        })) || [],
    })),
  ]

  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: true, margin: "-50px" })

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  }

  return (
    <div className="py-20 md:py-24 px-4 sm:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mb-12 md:mb-20 text-center max-w-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center justify-center p-2 mb-6 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-500 ltr:mr-2 rtl:ml-2" />
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            {t("explore_collections")}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-6xl font-black tracking-tighter mb-4 text-foreground drop-shadow-sm"
        >
          {t("discover")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-muted-foreground text-base md:text-lg font-light max-w-md mx-auto"
        >
          {t("description")}
        </motion.p>
      </div>

      <motion.div
        ref={containerRef}
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10"
      >
        {combinedItems.map((item) => (
          <ModernCard key={item.id} item={item} variants={itemVariants} />
        ))}
      </motion.div>
    </div>
  )
}

function ModernCard({ item, variants }: { item: any; variants: any }) {
  const { title, description, href, gradient, Icon, children } = item
  const t = useTranslations("AllCategories")

  return (
    <motion.div
      variants={variants}
      className="relative group rounded-[2rem] p-[2px] bg-white/5 dark:bg-white/5 hover:bg-transparent transition-colors duration-500"
    >
      <LocalizedClientLink href={href} className="absolute inset-0 z-20">
        <span className="sr-only">{t("go_to", { title })}</span>
      </LocalizedClientLink>

      {/* Glowing animated border background */}
      <div
        className={cn(
          "absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br blur-xl",
          gradient
        )}
      />

      {/* Main Card Content */}
      <div className="relative z-30 pointer-events-none min-h-[12rem] md:min-h-[16rem] flex flex-col p-6 md:p-8 rounded-[calc(2rem-2px)] bg-white/40 dark:bg-neutral-950/40 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] overflow-hidden">
        {/* Top Section */}
        <div className="flex justify-between items-start z-10 mb-6">
          <div
            className={cn(
              "w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/30 dark:border-white/10 bg-gradient-to-br",
              gradient
            )}
          >
            <Icon className="w-6 h-6 text-foreground drop-shadow-md" />
          </div>

          <div className="w-10 h-10 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-md flex items-center justify-center opacity-0 -translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 border border-white/30 dark:border-white/5">
            <ArrowRight className="w-5 h-5 text-foreground rtl:-rotate-180" />
          </div>
        </div>

        {/* Bottom Section */}
        <div className="z-10 mt-auto transform transition-transform duration-500">
          <h3 className="text-xl md:text-2xl font-bold tracking-tight mb-3 text-foreground group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-foreground group-hover:to-foreground/70 transition-all">
            {title}
          </h3>

          {children && children.length > 0 ? (
            <div className="flex flex-col gap-3 mt-2 relative z-30">
              {children.map((child: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2">
                  <LocalizedClientLink
                    href={child.href}
                    className="pointer-events-auto text-sm md:text-base font-bold text-foreground/90 hover:text-foreground hover:underline decoration-2 underline-offset-4 decoration-indigo-500/50 transition-all w-fit"
                  >
                    {child.title}
                  </LocalizedClientLink>
                  {child.subChildren && child.subChildren.length > 0 && (
                    <div className="flex flex-wrap gap-2 ltr:ml-2 rtl:mr-2">
                      {child.subChildren.map((sub: any, subIdx: number) => (
                        <LocalizedClientLink
                          key={subIdx}
                          href={sub.href}
                          className="pointer-events-auto text-[11px] md:text-xs font-semibold bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 hover:border-foreground/20 rounded-full px-3 py-1 backdrop-blur-sm transition-all text-foreground/80 hover:text-foreground"
                        >
                          {sub.title}
                        </LocalizedClientLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm font-medium line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

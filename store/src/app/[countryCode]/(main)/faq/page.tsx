import { getTranslations } from "next-intl/server"
import React from "react"
import { getFAQPageData } from "@lib/data/strapi-pages"
import { Metadata } from "next"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import SkeletonFAQPage from "@/modules/common/skeletons/templates/skeleton-faq-page"
import FAQBlocks from "./faq-blocks"

interface PageProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}) {
  const [t, pageData] = await Promise.all([
    getTranslations("Pages"),
    getFAQPageData(),
  ])
  const defaultTitle = t("faq_title")
  const defaultDesc = t("faq_desc")

  return {
    title: pageData?.title || defaultTitle,
    description: pageData?.description || defaultDesc,
  }
}

export default function FAQPage(props: PageProps) {
  return (
    <InstantPageBoundary fallback={<SkeletonFAQPage />}>
      <FAQPageContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function FAQPageContent({ params: paramsPromise }: PageProps) {
  const [t, data] = await Promise.all([
    getTranslations("Pages"),
    getFAQPageData(),
  ])
  await paramsPromise

  if (!data || !data.blocks || data.blocks.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md w-full bg-card border border-border/60 rounded-3xl p-8 shadow-xl backdrop-blur-md">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t("not_configured")}
          </h2>
          <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
            {t("not_configured_desc")}
          </p>
          <div className="p-3 bg-muted rounded-xl text-[11px] font-mono text-muted-foreground select-all">
            Single Type: FAQ Page
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <FAQBlocks blocks={data.blocks} />
    </div>
  )
}

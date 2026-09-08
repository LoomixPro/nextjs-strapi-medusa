import { getTranslations } from "next-intl/server"
import React from "react"
import { getTermsPageData } from "@lib/data/strapi-pages"
import { Metadata } from "next"
import InstantPageBoundary from "@modules/common/components/instant-page-boundary"
import TermsBlocks from "./terms-blocks"

interface PageProps {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}) {
  const [params, t, pageData] = await Promise.all([
    props.params,
    getTranslations("Pages"),
    getTermsPageData(),
  ])
  await params
  const defaultTitle = t("terms_title")
  const defaultDesc = t("terms_desc")

  return {
    title: pageData?.title || defaultTitle,
    description: pageData?.description || defaultDesc,
  }
}

export default function TermsPage(props: PageProps) {
  return (
    <InstantPageBoundary>
      <TermsPageContent params={props.params} />
    </InstantPageBoundary>
  )
}

async function TermsPageContent({ params: paramsPromise }: PageProps) {
  const [t, data] = await Promise.all([
    getTranslations("Pages"),
    getTermsPageData(),
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
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
            Single Type: Terms Page
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <TermsBlocks
        blocks={data.blocks}
        updatedAt={data.updatedAt}
        locale={data.locale}
      />
    </div>
  )
}

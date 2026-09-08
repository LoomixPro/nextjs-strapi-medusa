import { Suspense } from "react"
import SkeletonHomePage from "@/modules/common/skeletons/templates/skeleton-home-page"
import React from "react"
import { draftMode } from "next/headers"
import { getRegion } from "@lib/data/regions"
import { getHomepageData } from "@lib/data/homepage"
import BlockRenderer from "@/modules/home/components/BlockRenderer"
import { getMessages, getLocale } from "next-intl/server"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { setServerRequestStore } from "@lib/util/storefront-settings"

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}) {
  const [params, messages] = await Promise.all([
    props.params,
    getMessages() as Promise<any>,
  ])
  const { countryCode } = params

  const title = messages.HomePage?.title || "Medusa Next.js Starter Template"
  const description =
    messages.HomePage?.subtitle ||
    "A performant frontend ecommerce starter template with Next.js 16 and Medusa."

  return {
    title,
    description,
    keywords: messages.HomePage?.seo_keywords || [],
    alternates: {
      canonical: `/${countryCode}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
    },
  }
}

export default function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  return (
    <Suspense fallback={<SkeletonHomePage />}>
      <HomeContent params={props.params} />
    </Suspense>
  )
}

async function HomeContent(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const locale = await getLocale()
  const settings = await getStorefrontSettings()
  const draft = await draftMode()
  const messages = (await getMessages()) as any
  const { countryCode } = params
  setServerRequestStore(locale || "default", settings)
  const isDraft = draft.isEnabled
  const status = isDraft ? "draft" : "published"
  const [region, homepageData] = await Promise.all([
    getRegion(countryCode),
    getHomepageData(status),
  ])

  if (!region) {
    return null
  }

  const blocks = homepageData?.blocks || []

  return (
    <>
      {blocks.length > 0 ? (
        blocks.map((block, index) => (
          <React.Fragment
            key={`${block.__component}-${block.id || "no-id"}-${index}`}
          >
            <BlockRenderer
              block={block}
              region={region}
              countryCode={countryCode}
              index={index}
              isLast={index === blocks.length - 1}
            />
          </React.Fragment>
        ))
      ) : (
        <div className="flex items-center justify-center min-h-[50vh] text-ui-fg-subtle">
          <p className="text-lg">
            {messages.HomePage?.empty_state_message ||
              "No content available at the moment."}
          </p>
        </div>
      )}
    </>
  )
}

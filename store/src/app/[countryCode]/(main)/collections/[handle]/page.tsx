import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getCollectionByHandle, listCollections } from "@lib/data/collections"
import { listRegions } from "@lib/data/regions"
import { StoreCollection } from "@medusajs/types"
import CollectionTemplate from "@modules/collections/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getBaseURL } from "@lib/util/env"

type Props = {
  params: Promise<{ handle: string; countryCode: string }>
  searchParams: Promise<{
    page?: string
    sortBy?: SortOptions
  }>
}

export const PRODUCT_LIMIT = 12

export async function generateStaticParams() {
  try {
    const { collections } = await listCollections(
      { fields: "*products" },
      { isStatic: true }
    )

    if (!collections || collections.length === 0) {
      return [{ countryCode: "default", handle: "default" }]
    }

    const countryCodes = await listRegions().then(
      (regions) =>
        regions
          ?.map((r) => r.countries?.map((c) => c.iso_2))
          .flat()
          .filter(Boolean) as string[]
    )

    if (!countryCodes || countryCodes.length === 0) {
      return [{ countryCode: "default", handle: "default" }]
    }

    const collectionHandles = collections.map(
      (collection: StoreCollection) => collection.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string) =>
        collectionHandles.map((handle: string | undefined) => ({
          countryCode,
          handle,
        }))
      )
      .flat()

    return staticParams || [{ countryCode: "default", handle: "default" }]
  } catch (error) {
    console.warn(
      `Failed to generate static paths for collections: ${error instanceof Error ? error.message : "Unknown error"}. Skipping static generation.`
    )
    return [{ countryCode: "default", handle: "default" }]
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const collection = await getCollectionByHandle(params.handle)

  if (!collection) {
    notFound()
  }

  const baseUrl = getBaseURL()
  const title = collection.title
  const description = `Discover our ${collection.title} collection.`
  const canonicalUrl = `${baseUrl}/${params.countryCode}/collections/${params.handle}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function CollectionPage(props: Props) {
  return (
    <CollectionContent
      params={props.params}
      searchParams={props.searchParams}
    />
  )
}

async function CollectionContent(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const collection = await getCollectionByHandle(params.handle).then(
    (collection: StoreCollection) => collection
  )

  if (!collection) {
    notFound()
  }

  return (
    <CollectionTemplate
      collection={collection}
      page={page}
      sortBy={sortBy}
      countryCode={params.countryCode}
      searchParams={searchParams}
    />
  )
}

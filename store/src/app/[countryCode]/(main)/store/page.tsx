import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

import { getMessages } from "next-intl/server"
import { getStorefrontSettings } from "@lib/data/strapi-settings"

export async function generateMetadata() {
  const [messages, settings] = await Promise.all([
    getMessages() as Promise<any>,
    getStorefrontSettings(),
  ])
  return {
    title: settings.storePage?.title || messages.Store?.title || "Store",
    description:
      settings.storePage?.description ||
      messages.Store?.description ||
      "Explore all of our products.",
  }
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ])
  const { sortBy, page } = searchParams

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchParams={searchParams}
    />
  )
}

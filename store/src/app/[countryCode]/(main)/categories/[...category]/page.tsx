import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoryByHandle, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getBaseURL } from "@lib/util/env"

type Props = {
  params: Promise<{ category: string[]; countryCode: string }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
}

export async function generateStaticParams() {
  try {
    const product_categories = await listCategories(undefined, {
      isStatic: true,
    })

    if (!product_categories || product_categories.length === 0) {
      return [{ countryCode: "default", category: ["default"] }]
    }

    const countryCodes = await listRegions(true).then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes || countryCodes.length === 0) {
      return [{ countryCode: "default", category: ["default"] }]
    }

    const categoryHandles = product_categories.map(
      (category: any) => category.handle
    )

    const staticParams = countryCodes
      ?.map((countryCode: string | undefined) =>
        categoryHandles.map((handle: any) => ({
          countryCode,
          category: [handle],
        }))
      )
      .flat()

    return staticParams || [{ countryCode: "default", category: ["default"] }]
  } catch (error) {
    console.warn(
      `Failed to generate static paths for categories: ${error instanceof Error ? error.message : "Unknown error"}. Skipping static generation.`
    )
    return [{ countryCode: "default", category: ["default"] }]
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  try {
    const productCategory = await getCategoryByHandle(params.category, {
      isStatic: true,
    })

    if (!productCategory) {
      notFound()
    }

    const baseUrl = getBaseURL()
    const categoryPath = params.category.join("/")
    const canonicalUrl = `${baseUrl}/${params.countryCode}/categories/${categoryPath}`

    const title = productCategory.name
    const description =
      productCategory.description ?? `Explore ${productCategory.name} products.`

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
  } catch {
    notFound()
  }
}

export default async function CategoryPage(props: Props) {
  return (
    <CategoryContent params={props.params} searchParams={props.searchParams} />
  )
}

async function CategoryContent(props: Props) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { sortBy, page } = searchParams

  const productCategory = await getCategoryByHandle(params.category, {
    isStatic: true,
  })
  if (!productCategory) {
    notFound()
  }

  return (
    <CategoryTemplate
      category={productCategory}
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      searchParams={searchParams}
    />
  )
}

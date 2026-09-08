import React, { Suspense } from "react"

import SkeletonFilterSidebar from "@/modules/common/skeletons/components/skeleton-filter-sidebar"
import PaginatedProducts from "../../paginated-products"
import { SortOptions } from "@modules/store/components/sort-bar"
import StoreFilterSidebar from "@modules/store/components/store-filter-sidebar"
import StoreMobileFilters from "@modules/store/components/store-mobile-filters"
import ProductGridContainer from "@modules/store/components/product-grid-container"
import StoreListingToolbar from "@modules/store/components/store-listing-toolbar"
import { getTranslations } from "next-intl/server"
import { getStorefrontSettings } from "@lib/data/strapi-settings"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export interface StoreTemplateProps {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  searchParams?: Record<string, string | string[] | undefined>
  category?: HttpTypes.StoreProductCategory
  collection?: HttpTypes.StoreCollection
}

const StoreStyle1 = async ({
  sortBy,
  page,
  countryCode,
  searchParams,
  category,
  collection,
}: StoreTemplateProps) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy ?? "created_at"
  const tStore = await getTranslations("Store")
  const tNav = await getTranslations("Layout.nav")
  const settings = await getStorefrontSettings()

  let title = settings.storePage?.title ?? tStore("title")
  let description = settings.storePage?.description ?? tStore("description")

  if (category) {
    title = category.name
    description = category.description ?? ""
  } else if (collection) {
    title = collection.title
    description = ""
  }

  const parents = [] as HttpTypes.StoreProductCategory[]
  if (category) {
    const getParents = (cat: HttpTypes.StoreProductCategory) => {
      if (cat.parent_category) {
        parents.push(cat.parent_category)
        getParents(cat.parent_category)
      }
    }
    getParents(category)
  }

  const gridKey = `${pageNumber}-${sort}-${JSON.stringify(searchParams)}`

  return (
    <div
      className="content-container py-6 pt-20 sm:pt-24 pb-24"
      data-testid="category-container"
    >
      {/* Breadcrumbs (for Category or Collection) */}
      {(category || collection) && (
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 mb-4 px-4 sm:px-0 overflow-x-auto no-scrollbar">
          <LocalizedClientLink
            className="hover:text-primary transition-colors whitespace-nowrap"
            href="/store"
          >
            {tNav("store")}
          </LocalizedClientLink>
          <span className="text-gray-300 dark:text-zinc-600">/</span>
          {category &&
            parents.reverse().map((parent) => (
              <React.Fragment key={parent.id}>
                <LocalizedClientLink
                  className="hover:text-primary transition-colors whitespace-nowrap"
                  href={`/categories/${parent.handle}`}
                >
                  {parent.name}
                </LocalizedClientLink>
                <span className="text-gray-300 dark:text-zinc-600">/</span>
              </React.Fragment>
            ))}
          <span className="font-semibold text-gray-900 dark:text-zinc-100 whitespace-nowrap">
            {category ? category.name : collection?.title}
          </span>
        </nav>
      )}

      {/* Page Header */}
      <div className="mb-10 px-4 sm:px-0 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-base text-muted-foreground font-medium leading-relaxed">
            {description}
          </p>
        )}

        {/* Subcategories if Category */}
        {category?.category_children &&
          category.category_children.length > 0 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {category.category_children.map((c) => (
                <LocalizedClientLink
                  key={c.id}
                  href={`/categories/${c.handle}`}
                >
                  <div className="px-3.5 py-1.5 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium text-gray-800 dark:text-zinc-200">
                    {c.name}
                  </div>
                </LocalizedClientLink>
              ))}
            </div>
          )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Trigger */}
        <Suspense
          fallback={
            <div className="block lg:hidden w-full h-12 rounded-xl bg-muted/50 animate-pulse" />
          }
        >
          <StoreMobileFilters
            categoryId={category?.id}
            countryCode={countryCode}
          />
        </Suspense>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-[260px] flex-shrink-0">
          <Suspense fallback={<SkeletonFilterSidebar />}>
            <StoreFilterSidebar
              categoryId={category?.id}
              countryCode={countryCode}
            />
          </Suspense>
        </aside>

        {/* Product Listing Area */}
        <div className="flex-1 min-w-0 px-4 sm:px-0">
          <StoreListingToolbar />
          <ProductGridContainer suspenseKey={gridKey}>
            <PaginatedProducts
              sortBy={sort}
              page={pageNumber}
              categoryId={category?.id}
              collectionId={collection?.id}
              countryCode={countryCode}
              searchParams={searchParams}
            />
          </ProductGridContainer>
        </div>
      </div>
    </div>
  )
}

export default StoreStyle1

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

const StoreStyle2 = async ({
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
      className="content-container py-6 pt-24 sm:pt-28 pb-32"
      data-testid="category-container"
    >
      {/* Modern, Premium Hero Section */}
      <div className="relative mb-14 rounded-3xl overflow-hidden bg-gradient-to-r from-primary to-primary/85 text-primary-foreground shadow-2xl">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="relative z-10 px-8 py-16 text-center max-w-3xl mx-auto flex flex-col items-center justify-center">
          {/* Breadcrumbs for Category/Collection inside Hero */}
          {(category || collection) && (
            <nav className="flex items-center gap-2 text-xs sm:text-sm text-primary-foreground/80 mb-4 overflow-x-auto no-scrollbar">
              <LocalizedClientLink
                className="hover:text-white transition-colors whitespace-nowrap"
                href="/store"
              >
                {tNav("store")}
              </LocalizedClientLink>
              <span className="opacity-60">/</span>
              {category &&
                parents.reverse().map((parent) => (
                  <React.Fragment key={parent.id}>
                    <LocalizedClientLink
                      className="hover:text-white transition-colors whitespace-nowrap"
                      href={`/categories/${parent.handle}`}
                    >
                      {parent.name}
                    </LocalizedClientLink>
                    <span className="opacity-60">/</span>
                  </React.Fragment>
                ))}
              <span className="font-semibold text-white whitespace-nowrap">
                {category ? category.name : collection?.title}
              </span>
            </nav>
          )}

          {!category && !collection && (
            <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 text-sm font-semibold tracking-wider uppercase text-primary-foreground/80 shadow-lg">
              {tStore("title")}
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-primary-foreground to-primary-foreground/70 drop-shadow-sm">
            {title}
          </h1>

          {description && (
            <p className="text-base md:text-lg text-primary-foreground/80 font-medium leading-relaxed max-w-2xl mx-auto">
              {description}
            </p>
          )}

          {category?.category_children &&
            category.category_children.length > 0 && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {category.category_children.map((c) => (
                  <LocalizedClientLink
                    key={c.id}
                    href={`/categories/${c.handle}`}
                  >
                    <div className="px-4 py-1.5 bg-primary-foreground/10 hover:bg-primary-foreground/20 backdrop-blur-md border border-primary-foreground/20 rounded-full transition-all text-xs sm:text-sm font-semibold text-white">
                      {c.name}
                    </div>
                  </LocalizedClientLink>
                ))}
              </div>
            )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
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

        {/* Desktop Sidebar with Glassmorphism */}
        <aside className="hidden lg:block lg:w-[280px] flex-shrink-0">
          <div className="sticky top-24 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/50 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] transition-all duration-300">
            <Suspense fallback={<SkeletonFilterSidebar />}>
              <StoreFilterSidebar
                categoryId={category?.id}
                countryCode={countryCode}
              />
            </Suspense>
          </div>
        </aside>

        {/* Product Listing Area */}
        <div className="flex-1 min-w-0">
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

export default StoreStyle2

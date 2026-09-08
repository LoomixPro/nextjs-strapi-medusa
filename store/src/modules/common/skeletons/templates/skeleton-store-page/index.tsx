import React from "react"
import SkeletonProductGrid from "@/modules/common/skeletons/templates/skeleton-product-grid"

const SkeletonStorePage = () => {
  return (
    <div className="content-container py-6 pt-24 sm:pt-28 pb-24 animate-pulse">
      {/* Page Header Skeleton */}
      <div className="mb-12 px-4 sm:px-0 text-center max-w-2xl mx-auto flex flex-col items-center">
        <div className="w-48 h-10 bg-muted/50 rounded-md mb-3"></div>
        <div className="w-96 h-6 bg-muted/50 rounded-md"></div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Filter Trigger Skeleton (hidden on large) */}
        <div className="block lg:hidden w-full h-12 bg-muted/50 rounded-xl"></div>

        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden lg:block lg:w-[260px] flex-shrink-0">
          <div className="flex flex-col gap-6">
            {/* Category Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="w-32 h-5 bg-muted/50 rounded-md mb-2"></div>
              <div className="w-full h-4 bg-muted/50 rounded-md"></div>
              <div className="w-5/6 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-4/6 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-4 bg-muted/50 rounded-md"></div>
            </div>

            <div className="w-full h-[1px] bg-muted/50 my-2"></div>

            {/* Filter Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="w-24 h-5 bg-muted/50 rounded-md mb-2"></div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-muted/50"></div>
                <div className="w-8 h-8 rounded-full bg-muted/50"></div>
                <div className="w-8 h-8 rounded-full bg-muted/50"></div>
                <div className="w-8 h-8 rounded-full bg-muted/50"></div>
              </div>
            </div>

            <div className="w-full h-[1px] bg-muted/50 my-2"></div>

            {/* Price Skeleton */}
            <div className="flex flex-col gap-3">
              <div className="w-32 h-5 bg-muted/50 rounded-md mb-2"></div>
              <div className="w-full h-10 bg-muted/50 rounded-md"></div>
            </div>
          </div>
        </aside>

        {/* Product Listing Area Skeleton */}
        <div className="flex-1 min-w-0 px-4 sm:px-0">
          <SkeletonProductGrid />
        </div>
      </div>
    </div>
  )
}

export default SkeletonStorePage

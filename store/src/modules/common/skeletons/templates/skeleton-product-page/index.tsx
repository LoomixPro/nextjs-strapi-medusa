import React from "react"
import { Container } from "@medusajs/ui"

const SkeletonProductPage = () => {
  return (
    <div className="container max-w-7xl mx-auto px-4 pt-2 overflow-hidden animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="my-6 flex items-center gap-2">
        <div className="w-16 h-4 bg-muted/50 rounded-md"></div>
        <div className="w-4 h-4 bg-muted/50 rounded-md"></div>
        <div className="w-20 h-4 bg-muted/50 rounded-md"></div>
        <div className="w-4 h-4 bg-muted/50 rounded-md"></div>
        <div className="w-24 h-4 bg-muted/50 rounded-md"></div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16">
          {/* Main Gallery Column Skeleton */}
          <div className="md:col-span-7">
            <Container className="aspect-[3/4] w-full bg-muted/50 rounded-2xl" />
          </div>

          {/* Product Actions Column Skeleton */}
          <div className="md:col-span-5">
            <div className="h-full flex flex-col gap-8 mt-4">
              {/* Product Info Skeleton */}
              <div className="flex flex-col gap-4">
                <div className="w-32 h-6 bg-muted/50 rounded-md"></div>
                <div className="w-3/4 h-10 bg-muted/50 rounded-md"></div>
                <div className="w-24 h-8 bg-muted/50 rounded-md"></div>
              </div>

              <div className="w-full h-[1px] bg-muted/50 my-2"></div>

              {/* Actions Skeleton */}
              <div className="flex flex-col gap-y-10">
                <div className="flex flex-col gap-4">
                  <div className="w-full h-12 bg-muted/50 rounded-xl"></div>
                  <div className="w-full h-12 bg-muted/50 rounded-xl"></div>
                </div>

                {/* Description Skeleton */}
                <div className="flex flex-col gap-2">
                  <div className="w-full h-4 bg-muted/50 rounded-md"></div>
                  <div className="w-5/6 h-4 bg-muted/50 rounded-md"></div>
                  <div className="w-4/6 h-4 bg-muted/50 rounded-md"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonProductPage

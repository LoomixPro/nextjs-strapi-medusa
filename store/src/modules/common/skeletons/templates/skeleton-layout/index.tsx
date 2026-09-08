import React from "react"
import SkeletonFooter from "@/modules/common/skeletons/components/skeleton-footer"
import SkeletonHeader from "@/modules/common/skeletons/components/skeleton-header"

const SkeletonLayout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <SkeletonHeader />
      <main className="flex-1 animate-pulse">
        <div className="content-container py-12 space-y-8">
          <div className="mx-auto h-8 w-2/3 max-w-lg rounded-lg bg-muted/50" />
          <div className="mx-auto h-5 w-1/2 max-w-sm rounded-md bg-muted/40" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-square w-full rounded-xl bg-muted/40" />
                <div className="h-4 w-3/4 rounded-md bg-muted/40" />
                <div className="h-4 w-1/2 rounded-md bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <SkeletonFooter />
    </div>
  )
}

export default SkeletonLayout

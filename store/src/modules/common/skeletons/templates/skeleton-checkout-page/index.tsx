import React from "react"
import SkeletonOrderSummary from "@/modules/common/skeletons/components/skeleton-order-summary"

const SkeletonCheckoutPage = () => {
  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12 animate-pulse">
      <div className="flex flex-col gap-y-8">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className="rounded-2xl border border-border/60 bg-card/50 p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-32 rounded-md bg-muted/50" />
              <div className="h-4 w-16 rounded-md bg-muted/40" />
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="h-11 rounded-xl bg-muted/50" />
                <div className="h-11 rounded-xl bg-muted/50" />
              </div>
              <div className="h-11 rounded-xl bg-muted/50" />
              <div className="h-11 rounded-xl bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-y-6">
        <SkeletonOrderSummary />
      </div>
    </div>
  )
}

export default SkeletonCheckoutPage

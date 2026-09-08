import React from "react"
import SkeletonOrderItems from "@/modules/common/skeletons/components/skeleton-order-items"
import SkeletonOrderInformation from "@/modules/common/skeletons/components/skeleton-order-information"

const SkeletonOrderDetails = () => {
  return (
    <div className="flex flex-col justify-center gap-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div className="h-7 w-40 rounded-md bg-muted/50" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-muted/50" />
          <div className="h-10 w-24 rounded-xl bg-muted/40" />
        </div>
      </div>

      <div className="rounded-2xl border border-border p-5 space-y-3">
        <div className="h-5 w-36 rounded-md bg-muted/50" />
        <div className="h-4 w-48 rounded-md bg-muted/40" />
      </div>

      <SkeletonOrderItems />
      <SkeletonOrderInformation />
    </div>
  )
}

export default SkeletonOrderDetails

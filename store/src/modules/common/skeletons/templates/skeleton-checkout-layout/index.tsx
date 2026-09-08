import React from "react"
import SkeletonCheckoutPage from "@/modules/common/skeletons/templates/skeleton-checkout-page"

const SkeletonCheckoutLayout = () => {
  return (
    <div className="w-full bg-transparent relative small:min-h-screen">
      <div className="h-16 bg-transparent border-b border-border animate-pulse">
        <nav className="flex h-full items-center content-container justify-between">
          <div className="h-4 w-24 rounded-md bg-muted/50" />
          <div className="h-5 w-32 rounded-md bg-muted/50" />
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <SkeletonCheckoutPage />
      <div className="py-4 w-full flex items-center justify-center animate-pulse">
        <div className="h-4 w-40 rounded-md bg-muted/40" />
      </div>
    </div>
  )
}

export default SkeletonCheckoutLayout

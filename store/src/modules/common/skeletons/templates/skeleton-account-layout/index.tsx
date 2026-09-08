import React from "react"
import SkeletonAccountNav from "@/modules/common/skeletons/components/skeleton-account-nav"
import SkeletonAccountPage from "@/modules/common/skeletons/templates/skeleton-account-page"

const SkeletonAccountLayout = () => {
  return (
    <div className="flex-1 small:py-12 pb-24 md:pb-0 animate-pulse">
      <div className="flex-1 content-container h-full max-w-5xl mx-auto flex flex-col pt-4 md:pt-0">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 py-8 md:py-12">
          <div className="md:w-64 shrink-0">
            <SkeletonAccountNav />
          </div>
          <div className="flex-1 w-full min-w-0">
            <SkeletonAccountPage />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonAccountLayout

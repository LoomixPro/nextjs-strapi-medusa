import React from "react"

const SkeletonLoginPage = () => {
  return (
    <div className="w-full flex justify-center items-center min-h-[80vh] px-4 py-16 bg-transparent animate-pulse">
      <div className="w-full max-w-md bg-transparent rounded-[32px] shadow-sm border border-gray-100/50 dark:border-zinc-800/50 overflow-hidden">
        <div className="p-8">
          {/* Brand Icon Skeleton */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-muted/50 rounded-2xl"></div>
          </div>

          {/* Header Skeleton */}
          <div className="flex flex-col items-center text-center mb-8 gap-3">
            <div className="w-32 h-6 bg-muted/50 rounded-md"></div>
            <div className="w-48 h-4 bg-muted/50 rounded-md"></div>
          </div>

          {/* Content Skeleton (Inputs & Button) */}
          <div className="flex flex-col gap-5 mt-8">
            <div className="flex flex-col gap-2">
              <div className="w-16 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-12 bg-muted/50 rounded-2xl"></div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="w-20 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-12 bg-muted/50 rounded-2xl"></div>
            </div>

            <div className="w-full h-14 bg-muted/50 rounded-full mt-4"></div>

            <div className="w-32 h-4 bg-muted/50 rounded-md mx-auto mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonLoginPage

import React from "react"

const SkeletonAccountPage = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="bg-transparent rounded-[24px] border border-gray-100 dark:border-zinc-800 overflow-hidden">
        {/* Header Skeleton */}
        <div className="px-8 py-8 border-b border-dashed border-gray-100 dark:border-zinc-800">
          <div className="w-48 h-6 bg-muted/50 rounded-md mb-2"></div>
          <div className="w-3/4 max-w-sm h-4 bg-muted/50 rounded-md"></div>
        </div>

        {/* Content Skeleton */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-10 bg-muted/50 rounded-xl"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-10 bg-muted/50 rounded-xl"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-10 bg-muted/50 rounded-xl"></div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="w-24 h-4 bg-muted/50 rounded-md"></div>
              <div className="w-full h-10 bg-muted/50 rounded-xl"></div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-dashed border-gray-100 dark:border-zinc-800 flex flex-col gap-4">
            <div className="w-32 h-5 bg-muted/50 rounded-md mb-2"></div>
            <div className="w-full h-24 bg-muted/50 rounded-xl"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonAccountPage

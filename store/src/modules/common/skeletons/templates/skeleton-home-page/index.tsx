import React from "react"

const SkeletonHomePage = () => {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="w-full h-[60vh] sm:h-[70vh] bg-muted/40 relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4">
          <div className="w-64 sm:w-96 h-10 bg-muted/50 rounded-lg"></div>
          <div className="w-48 sm:w-72 h-6 bg-muted/40 rounded-md"></div>
          <div className="w-32 h-12 bg-muted/50 rounded-full mt-4"></div>
        </div>
      </div>

      {/* Content Blocks Skeleton */}
      <div className="content-container py-12 space-y-16">
        {/* Featured Products Block */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-48 h-8 bg-muted/50 rounded-md"></div>
          <div className="w-72 h-5 bg-muted/30 rounded-md"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-square w-full bg-muted/40 rounded-xl"></div>
                <div className="w-3/4 h-4 bg-muted/40 rounded-md"></div>
                <div className="w-1/2 h-4 bg-muted/30 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner Block */}
        <div className="w-full h-48 sm:h-64 bg-muted/30 rounded-2xl"></div>

        {/* Second Products Block */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-56 h-8 bg-muted/50 rounded-md"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="aspect-square w-full bg-muted/40 rounded-xl"></div>
                <div className="w-3/4 h-4 bg-muted/40 rounded-md"></div>
                <div className="w-1/2 h-4 bg-muted/30 rounded-md"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonHomePage

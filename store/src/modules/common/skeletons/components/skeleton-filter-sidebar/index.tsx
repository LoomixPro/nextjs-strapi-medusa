import React from "react"

const SkeletonFilterSidebar = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="h-5 w-32 rounded-md bg-muted/50 mb-2" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 w-full rounded-md bg-muted/40" />
        ))}
      </div>
      <div className="w-full h-px bg-muted/50" />
      <div className="flex flex-col gap-3">
        <div className="h-5 w-24 rounded-md bg-muted/50 mb-2" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-8 rounded-full bg-muted/50" />
          ))}
        </div>
      </div>
      <div className="w-full h-px bg-muted/50" />
      <div className="flex flex-col gap-3">
        <div className="h-5 w-32 rounded-md bg-muted/50 mb-2" />
        <div className="h-10 w-full rounded-md bg-muted/50" />
      </div>
    </div>
  )
}

export default SkeletonFilterSidebar

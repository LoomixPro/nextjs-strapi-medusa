import React from "react"

const SkeletonProductActions = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-14 rounded-xl bg-muted/50" />
        ))}
      </div>
      <div className="flex gap-3">
        <div className="h-12 flex-1 rounded-xl bg-muted/50" />
        <div className="h-12 w-12 rounded-xl bg-muted/40" />
      </div>
      <div className="h-14 w-full rounded-full bg-muted/50" />
    </div>
  )
}

export default SkeletonProductActions

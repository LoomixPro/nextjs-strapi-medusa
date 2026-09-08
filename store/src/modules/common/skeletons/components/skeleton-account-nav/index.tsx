import React from "react"

const SkeletonAccountNav = () => {
  return (
    <div className="animate-pulse space-y-2">
      <div className="hidden md:block space-y-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
          >
            <div className="h-5 w-5 rounded-md bg-muted/50" />
            <div className="h-4 w-24 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonAccountNav

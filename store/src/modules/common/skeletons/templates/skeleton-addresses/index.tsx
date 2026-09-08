import React from "react"

const SkeletonAddresses = () => {
  return (
    <div className="w-full space-y-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-md bg-muted/50" />
          <div className="h-4 w-56 rounded-md bg-muted/40" />
        </div>
        <div className="h-10 w-36 rounded-full bg-muted/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border p-6 space-y-4 relative"
          >
            <div className="absolute top-4 end-4 h-8 w-8 rounded-lg bg-muted/50" />
            <div className="h-5 w-24 rounded-md bg-muted/50" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted/40" />
              <div className="h-4 w-4/5 rounded-md bg-muted/40" />
              <div className="h-4 w-2/3 rounded-md bg-muted/30" />
            </div>
            <div className="flex gap-2 pt-2">
              <div className="h-8 w-20 rounded-lg bg-muted/40" />
              <div className="h-8 w-20 rounded-lg bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SkeletonAddresses

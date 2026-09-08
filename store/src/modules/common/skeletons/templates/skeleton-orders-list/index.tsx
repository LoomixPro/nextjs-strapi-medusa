import React from "react"

const SkeletonOrdersList = () => {
  return (
    <div className="w-full space-y-8 animate-pulse">
      <div className="flex flex-col gap-1.5 px-1">
        <div className="h-7 w-40 rounded-md bg-muted/50" />
        <div className="h-4 w-64 max-w-full rounded-md bg-muted/40" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[24px] border border-border overflow-hidden p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="h-5 w-32 rounded-md bg-muted/50" />
                <div className="h-4 w-24 rounded-md bg-muted/40" />
              </div>
              <div className="h-6 w-20 rounded-full bg-muted/50" />
            </div>
            <div className="flex gap-4">
              <div className="h-16 w-16 rounded-xl bg-muted/50 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-md bg-muted/50" />
                <div className="h-4 w-1/2 rounded-md bg-muted/40" />
              </div>
              <div className="h-5 w-20 rounded-md bg-muted/50" />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-border p-6 space-y-4">
        <div className="h-5 w-48 rounded-md bg-muted/50" />
        <div className="h-11 rounded-xl bg-muted/50" />
        <div className="h-10 w-32 rounded-full bg-muted/40" />
      </div>
    </div>
  )
}

export default SkeletonOrdersList

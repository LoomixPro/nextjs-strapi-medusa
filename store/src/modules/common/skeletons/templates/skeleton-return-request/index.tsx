import React from "react"

const SkeletonReturnRequest = () => {
  return (
    <div className="w-full space-y-8 animate-pulse">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="h-7 w-48 rounded-md bg-muted/50" />
        <div className="h-9 w-9 rounded-lg bg-muted/40" />
      </div>

      <div className="rounded-2xl border border-border p-5 space-y-2">
        <div className="h-5 w-32 rounded-md bg-muted/50" />
        <div className="h-4 w-40 rounded-md bg-muted/40" />
      </div>

      <div className="space-y-4">
        <div className="h-5 w-36 rounded-md bg-muted/50" />
        {[1, 2].map((i) => (
          <div
            key={i}
            className="flex gap-4 rounded-2xl border border-border p-4"
          >
            <div className="h-5 w-5 rounded-md bg-muted/50 shrink-0 mt-1" />
            <div className="h-16 w-16 rounded-xl bg-muted/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-md bg-muted/50" />
              <div className="h-4 w-1/2 rounded-md bg-muted/40" />
              <div className="h-9 w-24 rounded-lg bg-muted/40" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="h-5 w-40 rounded-md bg-muted/50" />
        <div className="h-11 rounded-xl bg-muted/50" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-32 rounded-md bg-muted/50" />
        <div className="h-11 rounded-xl bg-muted/50" />
      </div>

      <div className="h-12 w-full rounded-xl bg-muted/50" />
    </div>
  )
}

export default SkeletonReturnRequest

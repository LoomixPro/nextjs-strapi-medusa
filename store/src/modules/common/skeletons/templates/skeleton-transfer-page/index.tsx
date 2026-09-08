import React from "react"

const SkeletonTransferPage = () => {
  return (
    <div className="flex flex-col gap-y-4 items-start w-full max-w-lg mx-auto mt-10 mb-20 px-4 animate-pulse">
      <div className="w-full aspect-[4/3] max-w-xs mx-auto rounded-2xl bg-muted/50" />
      <div className="flex flex-col gap-y-6 w-full">
        <div className="h-7 w-3/4 rounded-md bg-muted/50" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded-md bg-muted/40" />
          <div className="h-4 w-full rounded-md bg-muted/40" />
          <div className="h-4 w-5/6 rounded-md bg-muted/30" />
        </div>
        <div className="w-full h-px bg-border" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded-md bg-muted/40" />
          <div className="h-4 w-4/5 rounded-md bg-muted/30" />
        </div>
        <div className="w-full h-px bg-border" />
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
          <div className="h-11 flex-1 rounded-xl bg-muted/50" />
          <div className="h-11 flex-1 rounded-xl bg-muted/40" />
        </div>
      </div>
    </div>
  )
}

export default SkeletonTransferPage

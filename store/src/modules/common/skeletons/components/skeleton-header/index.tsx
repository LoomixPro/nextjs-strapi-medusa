import React from "react"

const SkeletonHeader = () => {
  return (
    <header className="animate-pulse border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="hidden small:block">
        <div className="content-container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-8 w-28 rounded-lg bg-muted/50" />
            <div className="hidden md:flex items-center gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 w-16 rounded-md bg-muted/40" />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted/50" />
            <div className="h-9 w-9 rounded-full bg-muted/50" />
            <div className="h-9 w-9 rounded-full bg-muted/50" />
          </div>
        </div>
      </div>
      <div className="block small:hidden h-14 px-4 flex items-center justify-between">
        <div className="h-7 w-24 rounded-lg bg-muted/50" />
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-muted/50" />
          <div className="h-8 w-8 rounded-full bg-muted/50" />
        </div>
      </div>
    </header>
  )
}

export default SkeletonHeader

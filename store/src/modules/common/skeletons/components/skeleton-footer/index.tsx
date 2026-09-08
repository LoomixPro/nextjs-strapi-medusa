import React from "react"

const SkeletonFooter = () => {
  return (
    <footer className="animate-pulse border-t border-border/60 bg-background mt-auto">
      <div className="content-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <div className="h-7 w-32 rounded-lg bg-muted/50" />
            <div className="h-4 w-full max-w-xs rounded-md bg-muted/40" />
            <div className="h-4 w-4/5 rounded-md bg-muted/30" />
            <div className="flex gap-3 pt-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 w-9 rounded-full bg-muted/50" />
              ))}
            </div>
          </div>
          {[1, 2, 3].map((col) => (
            <div key={col} className="space-y-3">
              <div className="h-5 w-24 rounded-md bg-muted/50" />
              {[1, 2, 3, 4].map((row) => (
                <div key={row} className="h-4 w-28 rounded-md bg-muted/40" />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-border/60 flex justify-between items-center">
          <div className="h-4 w-48 rounded-md bg-muted/40" />
          <div className="h-4 w-32 rounded-md bg-muted/30" />
        </div>
      </div>
    </footer>
  )
}

export default SkeletonFooter

import React from "react"

const SkeletonAuthCallback = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-pulse">
      <div className="h-10 w-10 rounded-full border-4 border-muted/30 border-t-muted/60" />
      <div className="h-4 w-36 rounded-md bg-muted/50" />
    </div>
  )
}

export default SkeletonAuthCallback

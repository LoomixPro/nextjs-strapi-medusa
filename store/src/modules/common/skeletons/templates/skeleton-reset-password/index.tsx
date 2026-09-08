import React from "react"

const SkeletonResetPassword = () => {
  return (
    <div className="w-full flex justify-center items-center min-h-[80vh] px-4 py-16 animate-pulse">
      <div className="w-full max-w-md rounded-[32px] border border-border/60 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-2xl bg-muted/50" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-40 rounded-md bg-muted/50" />
            <div className="h-4 w-56 rounded-md bg-muted/40" />
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="h-4 w-24 rounded-md bg-muted/50" />
              <div className="h-12 rounded-2xl bg-muted/50" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md bg-muted/50" />
              <div className="h-12 rounded-2xl bg-muted/50" />
            </div>
            <div className="h-14 rounded-full bg-muted/50 mt-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonResetPassword

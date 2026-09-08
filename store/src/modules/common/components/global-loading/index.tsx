import React from "react"

export default function GlobalLoading() {
  return (
    <>
      {/* Placeholder to prevent layout collapse and footer jump */}
      <div className="min-h-[70vh] w-full" />

      {/* Full screen solid overlay */}
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[999999]">
        <div className="flex flex-col items-center justify-center gap-10">
          <div className="relative flex items-center justify-center w-24 h-24">
            {/* Expanding ambient rings */}
            <div
              className="absolute inset-0 rounded-full border border-foreground/10 animate-ping"
              style={{ animationDuration: "3s" }}
            />

            {/* Sleek outer rotating ring */}
            <div className="absolute inset-4 rounded-full border border-foreground/5" />
            <div
              className="absolute inset-4 rounded-full border border-t-foreground/80 border-r-foreground/80 border-b-transparent border-l-transparent animate-spin"
              style={{ animationDuration: "2s" }}
            />

            {/* Sleek inner rotating ring */}
            <div className="absolute inset-8 rounded-full border border-foreground/5" />
            <div
              className="absolute inset-8 rounded-full border border-b-foreground/60 border-l-foreground/60 border-t-transparent border-r-transparent animate-spin"
              style={{
                animationDuration: "1.5s",
                animationDirection: "reverse",
              }}
            />

            {/* Center dot */}
            <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse" />
          </div>

          <div className="text-[10px] font-medium tracking-[0.5em] uppercase text-muted-foreground animate-pulse">
            Loading
          </div>
        </div>
      </div>
    </>
  )
}

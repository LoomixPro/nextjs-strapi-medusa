import React from "react"

const SkeletonCartPage = () => {
  return (
    <div
      className="min-h-[80vh] pt-28 sm:pt-32 pb-28 sm:pb-16 text-foreground font-sans relative animate-pulse"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Product list skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-muted/60" />
                <div className="w-28 h-6 rounded-md bg-muted/60" />
                <div className="w-16 h-4 rounded-md bg-muted/40" />
              </div>
            </div>

            {/* Cart item cards skeleton */}
            <div className="flex flex-col gap-4">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="bg-card text-card-foreground rounded-2xl border border-border p-4 md:p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center relative"
                >
                  {/* Image container skeleton */}
                  <div className="w-full sm:w-28 h-36 sm:h-28 rounded-xl bg-muted/60 flex-shrink-0" />

                  {/* Info block skeleton */}
                  <div className="flex-grow flex flex-col justify-between w-full sm:w-auto gap-3">
                    <div className="space-y-2">
                      <div className="w-44 sm:w-56 h-5 rounded-md bg-muted/60" />
                      <div className="w-28 sm:w-36 h-4 rounded-md bg-muted/40" />
                    </div>
                    <div className="w-24 h-7 rounded-lg bg-muted/40" />
                  </div>

                  {/* Control actions & price skeleton */}
                  <div className="flex sm:flex-col justify-between sm:items-end w-full sm:w-auto h-full min-h-[90px] gap-3 border-t border-border sm:border-0 pt-3 sm:pt-0">
                    <div className="w-28 h-8 rounded-xl bg-muted/40" />
                    <div className="w-20 h-6 rounded-md bg-muted/60" />
                    <div className="w-8 h-8 rounded-xl bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Summary skeleton */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-card text-card-foreground p-6 rounded-3xl border border-border space-y-6">
              <div className="w-28 h-5 rounded-md bg-muted/60 pb-4 border-b border-border" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-24 h-4 rounded-md bg-muted/50" />
                  <div className="w-20 h-4 rounded-md bg-muted/50" />
                </div>

                <div className="w-full h-11 rounded-xl bg-muted/40" />

                <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
                  <div className="w-16 h-5 rounded-md bg-muted/60" />
                  <div className="w-24 h-6 rounded-md bg-muted/60" />
                </div>
              </div>

              <div className="pt-2">
                <div className="w-full h-14 rounded-full bg-muted/60" />
              </div>

              <div className="w-40 h-4 rounded mx-auto bg-muted/30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartPage

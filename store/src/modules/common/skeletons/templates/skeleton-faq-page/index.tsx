import React from "react"

const SkeletonFAQPage = () => {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero */}
      <section className="py-16 md:py-24 container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-4 flex flex-col items-center">
          <div className="h-6 w-28 rounded-full bg-muted/50" />
          <div className="h-10 w-3/4 rounded-xl bg-muted/50" />
          <div className="h-5 w-1/2 rounded-md bg-muted/40" />
        </div>
      </section>

      {/* Search */}
      <section className="container mx-auto px-4 pb-8">
        <div className="max-w-xl mx-auto h-12 rounded-full bg-muted/50" />
      </section>

      {/* Categories + accordion */}
      <section className="container mx-auto px-4 pb-16 space-y-10">
        {[1, 2, 3].map((cat) => (
          <div key={cat} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-muted/50" />
              <div className="h-6 w-40 rounded-md bg-muted/50" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 px-5 py-4"
                >
                  <div className="h-5 w-4/5 max-w-md rounded-md bg-muted/50" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Contact CTA */}
        <div className="rounded-3xl border border-border/60 bg-card/50 p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 rounded-md bg-muted/50" />
            <div className="h-4 w-full max-w-sm rounded-md bg-muted/40" />
          </div>
          <div className="h-12 w-36 rounded-full bg-muted/50 shrink-0" />
        </div>
      </section>
    </div>
  )
}

export default SkeletonFAQPage

import React from "react"

const SkeletonStaticPage = () => {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          <div className="h-6 w-24 rounded-full bg-muted/50 mb-6" />
          <div className="h-10 w-3/4 max-w-xl rounded-xl bg-muted/50 mb-5" />
          <div className="h-6 w-2/3 max-w-lg rounded-md bg-muted/40" />
        </div>
      </section>

      {/* Content blocks */}
      <section className="py-16 md:py-24 container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="space-y-4">
            <div className="h-7 w-48 rounded-lg bg-muted/50" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted/40" />
              <div className="h-4 w-full rounded-md bg-muted/40" />
              <div className="h-4 w-5/6 rounded-md bg-muted/30" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-border/60 p-6 space-y-4"
              >
                <div className="h-10 w-10 rounded-xl bg-muted/50" />
                <div className="h-5 w-3/4 rounded-md bg-muted/50" />
                <div className="h-4 w-full rounded-md bg-muted/40" />
                <div className="h-4 w-4/5 rounded-md bg-muted/30" />
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-border/60 p-8 md:p-10 space-y-4">
            <div className="h-7 w-56 rounded-lg bg-muted/50" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded-md bg-muted/40" />
              <div className="h-4 w-full rounded-md bg-muted/40" />
              <div className="h-4 w-3/4 rounded-md bg-muted/30" />
            </div>
            <div className="h-12 w-40 rounded-full bg-muted/50 mt-4" />
          </div>
        </div>
      </section>
    </div>
  )
}

export default SkeletonStaticPage

import React from "react"

export default function SkeletonBlogPost() {
  return (
    <div className="min-h-screen bg-background pt-24 md:pt-32 pb-10 md:pb-16 animate-pulse">
      <div className="max-w-[850px] mx-auto px-4 sm:px-6">
        {/* Back Link Breadcrumb */}
        <div className="mb-6 flex">
          <div className="w-24 h-5 bg-muted rounded-md"></div>
        </div>

        {/* Article Header */}
        <header className="space-y-6 mb-10 text-start flex flex-col items-start">
          <div className="w-20 h-6 bg-muted rounded-full"></div>

          <div className="space-y-3 w-full">
            <div className="w-full h-10 md:h-12 bg-muted rounded-xl"></div>
            <div className="w-3/4 h-10 md:h-12 bg-muted rounded-xl"></div>
          </div>

          {/* Author Meta */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-y border-border/60 py-4 mt-6 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted"></div>
              <div className="space-y-2">
                <div className="w-24 h-4 bg-muted rounded-md"></div>
                <div className="w-20 h-3 bg-muted rounded-md"></div>
              </div>
            </div>

            <div className="hidden sm:block h-6 w-px bg-border mx-4"></div>

            <div className="w-24 h-4 bg-muted rounded-md"></div>
            <div className="w-20 h-4 bg-muted rounded-md"></div>
          </div>
        </header>

        {/* Article Cover Image */}
        <div className="mb-10 aspect-[16/9] w-full bg-muted rounded-[28px]"></div>

        {/* Article Content */}
        <section className="space-y-6 mb-16 text-start flex flex-col items-start w-full">
          {/* Paragraph */}
          <div className="space-y-3 w-full">
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-5/6 h-4 bg-muted rounded-md"></div>
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-4/5 h-4 bg-muted rounded-md"></div>
          </div>

          {/* Heading */}
          <div className="w-1/2 h-8 bg-muted rounded-xl mt-10 mb-4"></div>

          {/* Paragraph */}
          <div className="space-y-3 w-full">
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-3/4 h-4 bg-muted rounded-md"></div>
          </div>

          {/* Image */}
          <div className="w-full h-64 bg-muted rounded-2xl my-8"></div>

          {/* Paragraph */}
          <div className="space-y-3 w-full">
            <div className="w-full h-4 bg-muted rounded-md"></div>
            <div className="w-5/6 h-4 bg-muted rounded-md"></div>
          </div>
        </section>

        {/* Related Reads Section */}
        <footer className="pt-12 border-t border-border flex flex-col items-start">
          <div className="w-32 h-6 bg-muted rounded-xl mb-8"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-2xl border border-border/80 bg-card"
              >
                <div className="w-24 h-24 shrink-0 rounded-xl bg-muted"></div>
                <div className="flex flex-col justify-between py-1 flex-1 items-start">
                  <div className="space-y-2 w-full">
                    <div className="w-full h-4 bg-muted rounded-md"></div>
                    <div className="w-3/4 h-4 bg-muted rounded-md"></div>
                  </div>
                  <div className="w-16 h-3 bg-muted rounded-md"></div>
                </div>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}

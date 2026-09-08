import React from "react"

export default function SkeletonBlogPage() {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-pulse">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-4 flex flex-col items-center">
        <div className="w-32 h-6 bg-muted rounded-full"></div>
        <div className="w-3/4 h-12 bg-muted rounded-xl mt-4"></div>
        <div className="w-1/2 h-6 bg-muted rounded-md mt-4"></div>
      </div>

      {/* Toolbar: Categories & Search */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between border-b border-border pb-8 mb-12">
        {/* Categories list */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-24 h-10 bg-muted rounded-full"></div>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-80 h-11 bg-muted rounded-full"></div>
      </div>

      {/* Featured Post */}
      <div className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-card/65 rounded-[32px] border border-border/80 p-6 md:p-8">
          {/* Image container */}
          <div className="lg:col-span-7 aspect-[16/9] w-full bg-muted rounded-[24px]"></div>

          {/* Info container */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-20 h-5 bg-muted rounded-md"></div>
              <div className="w-full h-8 bg-muted rounded-md"></div>
              <div className="w-4/5 h-8 bg-muted rounded-md"></div>
              <div className="w-full h-4 bg-muted rounded-md mt-4"></div>
              <div className="w-5/6 h-4 bg-muted rounded-md"></div>
            </div>

            {/* Author info */}
            <div className="flex items-center justify-between pt-6 border-t border-border/60 mt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-muted rounded-md"></div>
                  <div className="w-32 h-3 bg-muted rounded-md"></div>
                </div>
              </div>
              <div className="w-20 h-4 bg-muted rounded-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col bg-card rounded-[28px] border border-border/80 overflow-hidden"
          >
            <div className="aspect-[16/10] w-full bg-muted"></div>
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-full h-6 bg-muted rounded-md"></div>
                <div className="w-3/4 h-6 bg-muted rounded-md"></div>
                <div className="w-full h-3 bg-muted rounded-md mt-4"></div>
                <div className="w-5/6 h-3 bg-muted rounded-md"></div>
              </div>
              <div className="pt-4 border-t border-border/60 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="space-y-1">
                    <div className="w-20 h-3 bg-muted rounded-md"></div>
                    <div className="w-16 h-2 bg-muted rounded-md"></div>
                  </div>
                </div>
                <div className="w-16 h-3 bg-muted rounded-md"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

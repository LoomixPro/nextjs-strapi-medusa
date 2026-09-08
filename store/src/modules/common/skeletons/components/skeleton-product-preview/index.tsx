import { Container } from "@medusajs/ui"

const SkeletonProductPreview = () => {
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden bg-muted/10 border border-muted/20">
      <div className="aspect-[4/5] w-full bg-muted/20" />
      <div className="p-4 flex flex-col gap-3">
        <div className="w-3/4 h-5 bg-muted/20 rounded-md"></div>
        <div className="w-1/2 h-4 bg-muted/10 rounded-md"></div>
        <div className="w-1/3 h-6 bg-muted/20 rounded-md mt-2"></div>
      </div>
    </div>
  )
}

export default SkeletonProductPreview

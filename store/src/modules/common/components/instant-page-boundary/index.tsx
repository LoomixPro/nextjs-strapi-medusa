import { Suspense, ReactNode } from "react"

import SkeletonStaticPage from "@/modules/common/skeletons/templates/skeleton-static-page"

export default function InstantPageBoundary({
  children,
  fallback = <SkeletonStaticPage />,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>
}

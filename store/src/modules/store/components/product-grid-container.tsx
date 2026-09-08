"use client"

import { Suspense, useEffect, useState, useSyncExternalStore } from "react"

import SkeletonProductGrid from "@/modules/common/skeletons/templates/skeleton-product-grid"

import {
  endStoreFilterLoading,
  getStoreFilterLoading,
  subscribeStoreFilterLoading,
} from "./store-filter-loading"

export default function ProductGridContainer({
  children,
  suspenseKey,
}: {
  children: React.ReactNode
  suspenseKey: string
}) {
  const isFiltering = useSyncExternalStore(
    subscribeStoreFilterLoading,
    getStoreFilterLoading,
    () => false
  )

  const [displayKey, setDisplayKey] = useState(suspenseKey)

  useEffect(() => {
    endStoreFilterLoading()
    setDisplayKey(suspenseKey)
  }, [suspenseKey])

  useEffect(() => {
    return () => endStoreFilterLoading()
  }, [])

  const showSkeleton = isFiltering || displayKey !== suspenseKey

  if (showSkeleton) {
    return (
      <div
        className="w-full min-h-[480px]"
        aria-busy="true"
        aria-live="polite"
        data-testid="products-list-loader"
      >
        <SkeletonProductGrid />
      </div>
    )
  }

  return <Suspense fallback={<SkeletonProductGrid />}>{children}</Suspense>
}

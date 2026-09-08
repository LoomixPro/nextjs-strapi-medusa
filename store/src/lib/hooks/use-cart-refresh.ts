"use client"

import { useRouter } from "next/navigation"
import { useCallback } from "react"

/**
 * Re-fetches server-rendered cart UI after a cart server action.
 * Used alongside server-side revalidatePath/revalidateTag for Next.js 16.
 */
export function useCartRefresh() {
  const router = useRouter()

  return useCallback(() => {
    router.refresh()
  }, [router])
}

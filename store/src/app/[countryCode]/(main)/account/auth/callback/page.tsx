"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { validateGoogleCallback } from "@lib/data/customer"
import SkeletonAuthCallback from "@/modules/common/skeletons/templates/skeleton-auth-callback"

function CallbackContent() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const handleCallback = async () => {
      const params: Record<string, string> = {}
      searchParams.forEach((value, key) => {
        params[key] = value
      })

      if (!params.code) {
        setError("Invalid callback parameters.")
        return
      }

      const result = await validateGoogleCallback(params)
      if (result.success) {
        router.push("/account")
      } else {
        setError(result.error ?? "Authentication failed.")
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <p className="text-gray-600">{error}</p>
        <Link href="/account" className="text-blue-600 hover:underline">
          Return to login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-600">Authenticating...</p>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<SkeletonAuthCallback />}>
      <CallbackContent />
    </Suspense>
  )
}

export function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  if (error.message === "fetch failed") {
    return true
  }

  const cause = (error as { cause?: unknown }).cause

  if (cause instanceof Error) {
    const code = (cause as NodeJS.ErrnoException).code
    return (
      code === "ECONNREFUSED" || code === "ENOTFOUND" || code === "ETIMEDOUT"
    )
  }

  return false
}

export function warnMedusaUnreachable(context: string) {
  if (process.env.NODE_ENV !== "development") {
    return
  }

  console.warn(
    `[Medusa] ${context} failed — backend unreachable. Check MEDUSA_BACKEND_URL and ensure Medusa is running.`
  )
}

export async function withMedusaFallback<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (isNetworkFetchError(error)) {
      warnMedusaUnreachable(context)
      return fallback
    }

    throw error
  }
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries: number = 2,
  delay: number = 500,
  timeoutMs: number = 3500
): Promise<Response> {
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      const signal = options?.signal || AbortSignal.timeout(timeoutMs)
      const response = await fetch(url, {
        ...options,
        signal,
      })

      // If successful or 404 (not found is a valid response in Next.js/Strapi), return it
      if (response.ok || response.status === 404) {
        return response
      }

      lastError = new Error(`HTTP error! status: ${response.status}`)
    } catch (error) {
      lastError = error
    }

    // Wait before retrying (unless it's the last attempt)
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // If all retries failed, throw the last error so it can be handled by Next.js Error Boundary
  throw lastError
}

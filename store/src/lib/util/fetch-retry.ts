export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries: number = 3,
  delay: number = 1000
): Promise<Response> {
  let lastError: any

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options)

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

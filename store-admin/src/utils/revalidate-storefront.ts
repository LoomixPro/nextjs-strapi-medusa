type RevalidateOptions = {  productIds: string[]
  endpoint: "revalidate-reviews" | "revalidate-questions"
  logger: { warn: (msg: string) => void; error: (msg: string) => void }
  logPrefix: string
}

export async function revalidateStorefrontProducts({
  productIds,
  endpoint,
  logger,
  logPrefix,
}: RevalidateOptions) {
  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:8000"
  const revalidateSecret = process.env.REVALIDATE_SECRET

  if (!revalidateSecret) {
    logger.warn(`[${logPrefix}] REVALIDATE_SECRET is missing — storefront cache was not cleared`)
    return
  }

  if (productIds.length === 0) {
    return
  }

  const response = await fetch(`${storefrontUrl}/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-strapi-secret": revalidateSecret,
    },
    body: JSON.stringify({ products: productIds }),
  })

  if (!response.ok) {
    const body = await response.text()
    logger.error(
      `[${logPrefix}] Storefront revalidation failed (${response.status}): ${body}`
    )
  }
}

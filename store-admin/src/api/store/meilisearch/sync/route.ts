import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public Meilisearch re-sync endpoint (protected by secret header)
 * POST /store/meilisearch/sync
 * Header: x-revalidate-secret or Authorization: Bearer <secret>
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const headerSecret =
    (req.headers["x-revalidate-secret"] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "")

  if (!headerSecret || !process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ message: "Invalid or missing secret header" })
  }

  const actual = new Uint8Array(
    crypto.createHash("sha256").update(headerSecret).digest()
  )
  const expected = new Uint8Array(
    crypto.createHash("sha256").update(process.env.REVALIDATE_SECRET).digest()
  )

  if (!crypto.timingSafeEqual(actual, expected)) {
    return res.status(401).json({ message: "Invalid secret" })
  }

  const cacheService = req.scope.resolve(Modules.CACHE)
  const lockKey = "meilisearch:sync:lock"
  const isLocked = await cacheService.get(lockKey)

  if (isLocked) {
    return res.status(429).json({
      message: "A Meilisearch sync is already in progress. Please wait a minute.",
    })
  }

  await cacheService.set(lockKey, "1", 60)

  const eventModuleService = req.scope.resolve(Modules.EVENT_BUS)
  await eventModuleService.emit({
    name: "meilisearch.sync",
    data: {},
  })

  return res.json({
    message: "Full Meilisearch re-sync triggered",
  })
}

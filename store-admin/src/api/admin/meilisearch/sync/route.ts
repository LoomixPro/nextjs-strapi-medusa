import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Admin Meilisearch re-sync endpoint
 * Protected by Medusa Admin authentication
 * POST /admin/meilisearch/sync
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const cacheService = req.scope.resolve(Modules.CACHE)
  const lockKey = "meilisearch:sync:lock"
  const isLocked = await cacheService.get(lockKey)

  if (isLocked) {
    return res.status(429).json({
      message: "Sync is already running. Please wait 60 seconds.",
    })
  }

  await cacheService.set(lockKey, "1", 60)

  const eventModuleService = req.scope.resolve(Modules.EVENT_BUS)
  await eventModuleService.emit({
    name: "meilisearch.sync",
    data: {},
  })

  return res.json({
    message: "Syncing data to Meilisearch",
  })
}

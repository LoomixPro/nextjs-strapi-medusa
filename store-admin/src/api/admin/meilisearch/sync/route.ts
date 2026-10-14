import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Admin Meilisearch re-sync endpoint
 * Protected by Medusa Admin authentication
 * POST /admin/meilisearch/sync
 */
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const eventModuleService = req.scope.resolve(Modules.EVENT_BUS)
    await eventModuleService.emit({
        name: "meilisearch.sync",
        data: {},
    })
    res.json({
        message: "Syncing data to Meilisearch",
    })
}


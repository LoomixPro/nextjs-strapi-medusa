import crypto from "node:crypto"
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

/**
 * Public Meilisearch re-sync endpoint (protected by secret)
 * POST /store/meilisearch/sync?secret=YOUR_REVALIDATE_SECRET
 */
export async function POST(
    req: MedusaRequest,
    res: MedusaResponse
) {
    const secret = req.query.secret
    if (!secret || !process.env.REVALIDATE_SECRET) {
        res.status(401).json({ message: "Invalid secret" })
        return
    }

    const actual = new Uint8Array(crypto.createHash('sha256').update(secret as string).digest())
    const expected = new Uint8Array(crypto.createHash('sha256').update(process.env.REVALIDATE_SECRET).digest())
    if (!crypto.timingSafeEqual(actual, expected)) {
        res.status(401).json({ message: "Invalid secret" })
        return
    }

    const eventModuleService = req.scope.resolve(Modules.EVENT_BUS)
    await eventModuleService.emit({
        name: "meilisearch.sync",
        data: {},
    })
    res.json({
        message: "Full Meilisearch re-sync triggered",
    })
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const rawLimit = Number(req.query.limit) || 15
    const rawOffset = Number(req.query.offset) || 0

    const limit = Math.min(Math.max(rawLimit, 1), 100)
    const offset = Math.max(rawOffset, 0)

    const { data: returns, metadata } = await query.graph({
        entity: "return",
        fields: [
            "id",
            "order_id",
            "status",
            "refund_amount",
            "created_at",
            "requested_at",
            "received_at",
            "canceled_at",
            "display_id",
            "note",
            "order.*",
            "items.*",
            "items.reason.*",
        ],
        pagination: {
            take: limit,
            skip: offset,
            order: { created_at: "DESC" },
        },
    })

    res.json({
        returns,
        count: metadata?.count ?? 0,
        limit,
        offset,
    })
}

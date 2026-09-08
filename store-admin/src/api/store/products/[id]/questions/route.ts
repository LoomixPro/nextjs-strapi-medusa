import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetStoreQuestionsSchema = createFindParams()

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    const query = req.scope.resolve("query")

    const {
        data: questions,
        metadata: {
            count,
            take,
            skip,
        } = { count: 0, take: 10, skip: 0 },
    } = await query.graph({
        entity: "question",
        filters: {
            product_id: id,
            status: "approved",
        },
        ...req.queryConfig,
        pagination: {
            ...req.queryConfig.pagination,
            order: req.queryConfig.pagination?.order || { created_at: "DESC" },
        },
    })

    res.json({
        questions,
        count,
        limit: take,
        offset: skip,
    })
}

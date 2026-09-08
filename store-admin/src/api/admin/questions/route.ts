import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetAdminQuestionsSchema = createFindParams()

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const query = req.scope.resolve("query")

    const {
        data: questions,
        metadata: { count, take, skip } = {
            count: 0,
            take: 20,
            skip: 0,
        },
    } = await query.graph({
        entity: "question",
        ...req.queryConfig,
    })

    res.json({
        questions,
        count,
        limit: take,
        offset: skip,
    })
}

import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_QUESTION_MODULE } from "../../../../modules/product-question"
import ProductQuestionModuleService from "../../../../modules/product-question/service"

export const PostAdminDeleteQuestionsSchema = z.object({
    ids: z.array(z.string()),
})

export async function POST(
    req: MedusaRequest<z.infer<typeof PostAdminDeleteQuestionsSchema>>,
    res: MedusaResponse
) {
    const { ids } = req.validatedBody

    const questionModuleService: ProductQuestionModuleService = req.scope.resolve(
        PRODUCT_QUESTION_MODULE
    )

    await questionModuleService.deleteQuestions(ids)

    res.json({ deleted: true, ids })
}

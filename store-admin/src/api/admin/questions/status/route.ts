import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { updateQuestionWorkflow } from "../../../../workflows/update-question"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_QUESTION_MODULE } from "../../../../modules/product-question"
import ProductQuestionModuleService from "../../../../modules/product-question/service"
import { revalidateStorefrontProducts } from "../../../../utils/revalidate-storefront"

export const PostAdminUpdateQuestionsStatusSchema = z.object({
    ids: z.array(z.string()),
    status: z.enum(["pending", "approved", "rejected"]),
})

export async function POST(
    req: MedusaRequest<z.infer<typeof PostAdminUpdateQuestionsStatusSchema>>,
    res: MedusaResponse
) {
    const { ids, status } = req.validatedBody

    const { result } = await updateQuestionWorkflow(req.scope).run({
        input: ids.map((id) => ({
            id,
            status,
        })),
    })

    try {
        const questionModuleService: ProductQuestionModuleService = req.scope.resolve(PRODUCT_QUESTION_MODULE)
        const questions = await questionModuleService.listQuestions({ id: ids })
        const productIds = Array.from(new Set(questions.map((q) => q.product_id)))
        const logger = req.scope.resolve("logger")

        await revalidateStorefrontProducts({
            productIds,
            endpoint: "revalidate-questions",
            logger,
            logPrefix: "Questions",
        })
    } catch (err) {
        req.scope.resolve("logger").error(`Failed to revalidate questions cache: ${err}`)
    }

    res.json(result)
}

import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { answerQuestionWorkflow } from "../../../../workflows/answer-question"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_QUESTION_MODULE } from "../../../../modules/product-question"
import ProductQuestionModuleService from "../../../../modules/product-question/service"
import { revalidateStorefrontProducts } from "../../../../utils/revalidate-storefront"

export const PostAdminAnswerQuestionSchema = z.object({
    answer_text: z.string(),
})

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    const questionModuleService: ProductQuestionModuleService = req.scope.resolve(
        PRODUCT_QUESTION_MODULE
    )

    const question = await questionModuleService.retrieveQuestion(id)

    res.json({ question })
}

export async function POST(
    req: MedusaRequest<z.infer<typeof PostAdminAnswerQuestionSchema>>,
    res: MedusaResponse
) {
    const { id } = req.params
    const { answer_text } = req.validatedBody

    const { result } = await answerQuestionWorkflow(req.scope).run({
        input: {
            id,
            answer_text,
        },
    })

    try {
        const questionModuleService: ProductQuestionModuleService = req.scope.resolve(PRODUCT_QUESTION_MODULE)
        const question = await questionModuleService.retrieveQuestion(id)
        const logger = req.scope.resolve("logger")

        await revalidateStorefrontProducts({
            productIds: [question.product_id],
            endpoint: "revalidate-questions",
            logger,
            logPrefix: "Questions",
        })
    } catch (err) {
        req.scope.resolve("logger").error(`Failed to revalidate questions cache: ${err}`)
    }

    res.json(result)
}

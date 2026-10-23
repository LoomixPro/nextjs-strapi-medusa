import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { answerQuestionWorkflow } from "../../../../workflows/answer-question"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_QUESTION_MODULE } from "../../../../modules/product-question"
import ProductQuestionModuleService from "../../../../modules/product-question/service"
import { revalidateStorefrontProducts } from "../../../../utils/revalidate-storefront"

export const PostAdminAnswerQuestionSchema = z.object({
  answer_text: z.string().trim().min(1).max(5000),
})

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const questionModuleService: ProductQuestionModuleService = req.scope.resolve(
      PRODUCT_QUESTION_MODULE
    )
    const question = await questionModuleService.retrieveQuestion(id)
    if (!question) {
      return res.status(404).json({ message: "Question not found" })
    }
    return res.json({ question })
  } catch {
    return res.status(404).json({ message: "Question not found" })
  }
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
    const questionModuleService: ProductQuestionModuleService =
      req.scope.resolve(PRODUCT_QUESTION_MODULE)
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

  return res.json(result)
}

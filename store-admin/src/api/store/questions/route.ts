import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { createQuestionWorkflow } from "../../../workflows/create-question"
import { z } from "@medusajs/framework/zod"

export const PostStoreQuestionSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    question_text: z.string(),
    product_id: z.string(),
})

type PostStoreQuestionReq = z.infer<typeof PostStoreQuestionSchema>

export const POST = async (
    req: MedusaRequest<PostStoreQuestionReq>,
    res: MedusaResponse
) => {
    const input = req.validatedBody

    const { result } = await createQuestionWorkflow(req.scope)
        .run({
            input,
        })

    res.json(result)
}

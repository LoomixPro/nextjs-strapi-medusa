import type {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { toggleReviewReactionWorkflow } from "../../../../../workflows/toggle-review-reaction"
import { z } from "@medusajs/framework/zod"

export const PostStoreReviewReactionSchema = z.object({
    type: z.enum(["like", "dislike"]),
})

type PostStoreReviewReactionReq = z.infer<typeof PostStoreReviewReactionSchema>

export const POST = async (
    req: AuthenticatedMedusaRequest<PostStoreReviewReactionReq>,
    res: MedusaResponse
) => {
    const { id } = req.params
    const { type } = req.validatedBody

    const customerId = req.auth_context?.actor_id
    if (!customerId) {
        return res.status(401).json({ message: "Authentication required" })
    }

    const { result } = await toggleReviewReactionWorkflow(req.scope)
        .run({
            input: {
                review_id: id,
                customer_id: customerId,
                type,
            },
        })

    res.json(result)
}

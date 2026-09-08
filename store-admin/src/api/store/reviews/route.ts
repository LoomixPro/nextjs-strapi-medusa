import type {
    AuthenticatedMedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { createReviewWorkflow } from "../../../workflows/create-review"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { z } from "@medusajs/framework/zod"

export const PostStoreReviewSchema = z.object({
    title: z.string().optional(),
    content: z.string(),
    rating: z.preprocess(
        (val) => {
            if (val && typeof val === "string") {
                return parseInt(val)
            }
            return val
        },
        z.number().min(1).max(5)
    ),
    product_id: z.string(),
    first_name: z.string(),
    last_name: z.string(),
})

type PostStoreReviewReq = z.infer<typeof PostStoreReviewSchema>

export const POST = async (
    req: AuthenticatedMedusaRequest<PostStoreReviewReq>,
    res: MedusaResponse
) => {
    const input = req.validatedBody
    const customerId = req.auth_context?.actor_id

    // Check if customer has purchased this product
    let isVerifiedBuyer = false
    if (customerId) {
        try {
            const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
            const { data: orders } = await query.graph({
                entity: "order",
                fields: ["id", "items.*"],
                filters: {
                    customer_id: customerId,
                },
            })

            // Check if any order contains this product
            isVerifiedBuyer = orders.some((order: any) =>
                order.items?.some((item: any) => item.product_id === input.product_id)
            )
        } catch (e) {
            // If we can't check, default to false
            console.error("Error checking verified buyer status:", e)
        }
    }

    const { result } = await createReviewWorkflow(req.scope)
        .run({
            input: {
                ...input,
                customer_id: customerId,
                is_verified_buyer: isVerifiedBuyer,
            },
        })

    res.json(result)
}

import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { updateReviewWorkflow } from "../../../../workflows/update-review"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import ProductReviewModuleService from "../../../../modules/product-review/service"

export const PostAdminUpdateReviewsStatusSchema = z.object({
    ids: z.array(z.string()),
    status: z.enum(["pending", "approved", "rejected"]),
})

export async function POST(
    req: MedusaRequest<z.infer<typeof PostAdminUpdateReviewsStatusSchema>>,
    res: MedusaResponse
) {
    const { ids, status } = req.validatedBody

    const { result } = await updateReviewWorkflow(req.scope).run({
        input: ids.map((id) => ({
            id,
            status,
        })),
    })

    try {
        const reviewModuleService: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
        const reviews = await reviewModuleService.listReviews({ id: ids })
        const productIds = Array.from(new Set(reviews.map((r) => r.product_id)))

        const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:8000"
        const revalidateSecret = process.env.REVALIDATE_SECRET
        const logger = req.scope.resolve("logger")

        if (!revalidateSecret) {
            logger.warn("[Reviews] REVALIDATE_SECRET is missing — storefront cache was not cleared")
        } else if (productIds.length > 0) {
            const response = await fetch(`${storefrontUrl}/api/revalidate-reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-strapi-secret": revalidateSecret,
                },
                body: JSON.stringify({ products: productIds }),
            })

            if (!response.ok) {
                const body = await response.text()
                logger.error(
                    `[Reviews] Storefront revalidation failed (${response.status}): ${body}`
                )
            }
        }
    } catch (err) {
        req.scope.resolve("logger").error(`Failed to revalidate reviews cache: ${err}`)
    }

    res.json(result)
}

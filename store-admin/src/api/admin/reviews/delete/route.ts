import type {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import ProductReviewModuleService from "../../../../modules/product-review/service"

export const PostAdminDeleteReviewsSchema = z.object({
    ids: z.array(z.string()),
})

export async function POST(
    req: MedusaRequest<z.infer<typeof PostAdminDeleteReviewsSchema>>,
    res: MedusaResponse
) {
    const { ids } = req.validatedBody

    const reviewModuleService: ProductReviewModuleService = req.scope.resolve(
        PRODUCT_REVIEW_MODULE
    )

    await reviewModuleService.deleteReviews(ids)

    res.json({ deleted: true, ids })
}

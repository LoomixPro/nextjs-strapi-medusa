import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import ProductReviewModuleService from "../../../../../modules/product-review/service"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { z } from "zod"

export const GetStoreReviewsSchema = z.object({
    is_verified_buyer: z.union([z.boolean(), z.string()]).optional(),
}).merge(createFindParams())

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const { id } = req.params

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const reviewModuleService: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)

    // Build filters, converting string booleans to actual booleans
    const filters: Record<string, any> = {
        product_id: id,
        status: "approved",
    }

    if (req.filterableFields?.is_verified_buyer !== undefined) {
        const val = req.filterableFields.is_verified_buyer
        filters.is_verified_buyer = val === true || val === "true"
    }

    // Get reviews for product
    const { data: reviews, metadata: {
        count,
        take,
        skip,
    } = { count: 0, take: 10, skip: 0 } } = await query.graph({
        entity: "review",
        filters,
        ...req.queryConfig,
        pagination: {
            ...req.queryConfig.pagination,
            order: req.queryConfig.pagination?.order || { created_at: "DESC" },
        }
    })

    // Get user reactions if authenticated
    const customerId = (req as any).auth_context?.actor_id
    const reviewIds = reviews.map((r: any) => r.id)
    const userReactions = await reviewModuleService.getUserReactionsForReviews(
        reviewIds,
        customerId
    )

    // Attach user_reaction to each review
    const reviewsWithReactions = reviews.map((review: any) => ({
        ...review,
        user_reaction: userReactions[review.id] ?? null,
    }))

    res.json({
        reviews: reviewsWithReactions,
        count,
        limit: take,
        offset: skip,
        average_rating: await reviewModuleService.getAverageRating(id),
    })
}

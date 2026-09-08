import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../../modules/product-review"
import ProductReviewModuleService from "../../modules/product-review/service"

export type ToggleReviewReactionStepInput = {
    review_id: string
    customer_id: string
    type: "like" | "dislike"
}

export const toggleReviewReactionStep = createStep(
    "toggle-review-reaction",
    async (input: ToggleReviewReactionStepInput, { container }) => {
        const reviewModuleService: ProductReviewModuleService = container.resolve(
            PRODUCT_REVIEW_MODULE
        )

        const result = await reviewModuleService.toggleReaction(
            input.review_id,
            input.customer_id,
            input.type
        )

        return new StepResponse(result)
    }
)

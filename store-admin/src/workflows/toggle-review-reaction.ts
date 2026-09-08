import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { toggleReviewReactionStep } from "./steps/toggle-review-reaction"

type ToggleReviewReactionInput = {
    review_id: string
    customer_id: string
    type: "like" | "dislike"
}

export const toggleReviewReactionWorkflow = createWorkflow(
    "toggle-review-reaction",
    (input: ToggleReviewReactionInput) => {
        const result = toggleReviewReactionStep(input)

        return new WorkflowResponse(result)
    }
)

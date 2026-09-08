import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createQuestionStep } from "./steps/create-question"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

type CreateQuestionInput = {
    name: string
    email: string
    question_text: string
    product_id: string
}

export const createQuestionWorkflow = createWorkflow(
    "create-question",
    (input: CreateQuestionInput) => {
        // Check product exists
        useQueryGraphStep({
            entity: "product",
            fields: ["id"],
            filters: {
                id: input.product_id,
            },
            options: {
                throwIfKeyNotFound: true,
            },
        })

        // Create the question
        const question = createQuestionStep(input)

        return new WorkflowResponse({
            question,
        })
    }
)

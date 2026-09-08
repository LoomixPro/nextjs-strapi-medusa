import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateQuestionStep } from "./steps/update-question"

type UpdateQuestionInput = {
    id: string
    status: "pending" | "approved" | "rejected"
}[]

export const updateQuestionWorkflow = createWorkflow(
    "update-question",
    (input: UpdateQuestionInput) => {
        const questions = updateQuestionStep(input)

        return new WorkflowResponse({
            questions,
        })
    }
)

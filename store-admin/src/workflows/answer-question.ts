import {
    createWorkflow,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { answerQuestionStep } from "./steps/answer-question"

type AnswerQuestionInput = {
    id: string
    answer_text: string
}

export const answerQuestionWorkflow = createWorkflow(
    "answer-question",
    (input: AnswerQuestionInput) => {
        const question = answerQuestionStep(input)

        return new WorkflowResponse({
            question,
        })
    }
)

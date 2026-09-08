import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_QUESTION_MODULE } from "../../modules/product-question"
import ProductQuestionModuleService from "../../modules/product-question/service"

export type AnswerQuestionStepInput = {
    id: string
    answer_text: string
}

export const answerQuestionStep = createStep(
    "answer-question",
    async (input: AnswerQuestionStepInput, { container }) => {
        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        // Get the old question for compensation
        const oldQuestion = await questionModuleService.retrieveQuestion(input.id)

        const question = await questionModuleService.updateQuestions({
            id: input.id,
            answer_text: input.answer_text,
            status: "approved",
        })

        return new StepResponse(question, {
            id: input.id,
            answer_text: oldQuestion.answer_text,
            status: oldQuestion.status,
        })
    },
    async (compensationData, { container }) => {
        if (!compensationData) {
            return
        }

        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        await questionModuleService.updateQuestions({
            id: compensationData.id,
            answer_text: compensationData.answer_text,
            status: compensationData.status,
        })
    }
)

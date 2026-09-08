import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_QUESTION_MODULE } from "../../modules/product-question"
import ProductQuestionModuleService from "../../modules/product-question/service"

export type CreateQuestionStepInput = {
    name: string
    email: string
    question_text: string
    product_id: string
}

export const createQuestionStep = createStep(
    "create-question",
    async (input: CreateQuestionStepInput, { container }) => {
        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        const question = await questionModuleService.createQuestions(input)

        return new StepResponse(question, question.id)
    },
    async (questionId, { container }) => {
        if (!questionId) {
            return
        }

        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        await questionModuleService.deleteQuestions(questionId)
    }
)

import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_QUESTION_MODULE } from "../../modules/product-question"
import ProductQuestionModuleService from "../../modules/product-question/service"

export type UpdateQuestionStepInput = {
    id: string
    status: "pending" | "approved" | "rejected"
}[]

export const updateQuestionStep = createStep(
    "update-question",
    async (input: UpdateQuestionStepInput, { container }) => {
        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        // Get old statuses for compensation
        const oldQuestions = await questionModuleService.listQuestions({
            id: input.map((q) => q.id),
        })

        const result = await Promise.all(
            input.map((q) =>
                questionModuleService.updateQuestions({
                    id: q.id,
                    status: q.status,
                })
            )
        )

        return new StepResponse(
            result,
            oldQuestions.map((q) => ({
                id: q.id,
                status: q.status,
            }))
        )
    },
    async (compensationData, { container }) => {
        if (!compensationData) {
            return
        }

        const questionModuleService: ProductQuestionModuleService = container.resolve(
            PRODUCT_QUESTION_MODULE
        )

        await Promise.all(
            compensationData.map((q: any) =>
                questionModuleService.updateQuestions({
                    id: q.id,
                    status: q.status,
                })
            )
        )
    }
)

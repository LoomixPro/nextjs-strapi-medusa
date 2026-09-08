import { model } from "@medusajs/framework/utils"

const Question = model.define("question", {
    id: model.id().primaryKey(),
    name: model.text(),
    email: model.text(),
    question_text: model.text(),
    answer_text: model.text().nullable(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    product_id: model.text().index("IDX_QUESTION_PRODUCT_ID"),
})

export default Question

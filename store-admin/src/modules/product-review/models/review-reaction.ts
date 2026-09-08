import { model } from "@medusajs/framework/utils"

const ReviewReaction = model.define("review_reaction", {
    id: model.id().primaryKey(),
    review_id: model.text().index("IDX_REVIEW_REACTION_REVIEW_ID"),
    customer_id: model.text().index("IDX_REVIEW_REACTION_CUSTOMER_ID"),
    type: model.enum(["like", "dislike"]),
})
    .indexes([
        {
            on: ["review_id", "customer_id"],
            unique: true,
            name: "IDX_REVIEW_REACTION_UNIQUE",
        },
    ])

export default ReviewReaction

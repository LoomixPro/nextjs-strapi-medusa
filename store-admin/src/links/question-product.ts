import { defineLink } from "@medusajs/framework/utils"
import ProductQuestionModule from "../modules/product-question"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
    {
        linkable: ProductQuestionModule.linkable.question,
        field: "product_id",
        isList: false,
    },
    ProductModule.linkable.product,
    {
        readOnly: true,
    }
)

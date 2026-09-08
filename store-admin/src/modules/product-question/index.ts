import { Module } from "@medusajs/framework/utils"
import ProductQuestionModuleService from "./service"

export const PRODUCT_QUESTION_MODULE = "productQuestion"

export default Module(PRODUCT_QUESTION_MODULE, {
    service: ProductQuestionModuleService,
})

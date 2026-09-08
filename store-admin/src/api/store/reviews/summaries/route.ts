import {
    MedusaRequest,
    MedusaResponse,
} from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import ProductReviewModuleService from "../../../../modules/product-review/service"

export const GET = async (
    req: MedusaRequest,
    res: MedusaResponse
) => {
    const productIdsParam = (req.query.product_ids || req.query["product_ids[]"]) as string | string[]

    if (!productIdsParam) {
        return res.json({ summaries: {} })
    }

    const productIds = Array.isArray(productIdsParam)
        ? productIdsParam
        : productIdsParam.split(",").map(id => id.trim()).filter(Boolean)

    if (productIds.length === 0) {
        return res.json({ summaries: {} })
    }

    const reviewModuleService: ProductReviewModuleService = req.scope.resolve(PRODUCT_REVIEW_MODULE)
    const summaries = await reviewModuleService.getBatchSummaries(productIds)

    res.json({ summaries })
}

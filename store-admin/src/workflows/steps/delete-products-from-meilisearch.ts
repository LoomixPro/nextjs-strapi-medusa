import {
    createStep,
    StepResponse,
} from "@medusajs/framework/workflows-sdk"
import { MEILISEARCH_MODULE } from "../../modules/meilisearch"
import MeilisearchModuleService from "../../modules/meilisearch/service"

export type DeleteProductsFromMeilisearchStep = {
    ids: string[]
}

export const deleteProductsFromMeilisearchStep = createStep(
    "delete-products-from-meilisearch-step",
    async (
        { ids }: DeleteProductsFromMeilisearchStep,
        { container }
    ) => {
        const meilisearchModuleService = container.resolve<MeilisearchModuleService>(
            MEILISEARCH_MODULE
        )

        const existingRecords = await meilisearchModuleService.retrieveFromIndex(
            ids,
            "product"
        )
        await meilisearchModuleService.deleteFromIndex(
            ids,
            "product"
        )

        return new StepResponse(undefined, existingRecords)
    },
    async (existingRecords, { container }) => {
        if (!existingRecords) {
            return
        }
        const meilisearchModuleService = container.resolve<MeilisearchModuleService>(
            MEILISEARCH_MODULE
        )

        await meilisearchModuleService.indexData(
            existingRecords,
            "product"
        )
    }
)

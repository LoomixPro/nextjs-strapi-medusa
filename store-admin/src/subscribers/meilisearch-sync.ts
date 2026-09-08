import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { syncProductsWorkflow } from "../workflows/sync-products"
import MeilisearchModuleService from "../modules/meilisearch/service"

export default async function meilisearchSyncHandler({
    container,
}: SubscriberArgs) {
    const logger = container.resolve("logger")

    try {
        const meilisearchService: MeilisearchModuleService = container.resolve("meilisearch")
        await meilisearchService.deleteAllDocuments()
        logger.info("Cleared existing documents from Meilisearch index.")
    } catch (e: any) {
        logger.warn(`Could not clear existing Meilisearch index: ${e?.message}`)
    }

    let hasMore = true
    let offset = 0
    const limit = 50
    let totalIndexed = 0

    logger.info("Starting product indexing...")

    while (hasMore) {
        const { result: { products, metadata } } = await syncProductsWorkflow(container)
            .run({
                input: {
                    limit,
                    offset,
                },
            })

        hasMore = offset + limit < (metadata?.count ?? 0)
        offset += limit
        totalIndexed += products.length
    }

    logger.info(`Successfully indexed ${totalIndexed} products`)
}

export const config: SubscriberConfig = {
    event: "meilisearch.sync",
}

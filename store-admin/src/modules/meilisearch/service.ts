const { Meilisearch } = require("meilisearch")
import { MedusaError } from "@medusajs/framework/utils"

type MeilisearchOptions = {
    host: string;
    apiKey: string;
    productIndexName: string;
}

export type MeilisearchIndexType = "product"

export default class MeilisearchModuleService {
    private client: typeof Meilisearch
    private options: MeilisearchOptions

    constructor({ }, options: MeilisearchOptions) {
        if (!options.host || !options.apiKey || !options.productIndexName) {
            throw new MedusaError(
                MedusaError.Types.INVALID_ARGUMENT,
                "Meilisearch options are required"
            )
        }
        this.client = new Meilisearch({
            host: options.host,
            apiKey: options.apiKey,
        })
        this.options = options
    }

    async getIndexName(type: MeilisearchIndexType) {
        switch (type) {
            case "product":
                return this.options.productIndexName
            default:
                throw new Error(`Invalid index type: ${type}`)
        }
    }

    async updateSettings(type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        if (type === "product") {
            await index.updateSettings({
                filterableAttributes: [
                    "categories.id",
                    "categories.handle",
                    "tags.id",
                    "tags.value",
                    "collection_id",
                    "variants.calculated_price.calculated_amount",
                    "variants.calculated_price.currency_code",
                    "options.value",
                    "variants.inventory_quantity",
                    "color_facets",
                    "prices_by_currency",
                    "on_sale",
                ],
                sortableAttributes: [
                    "created_at",
                    "variants.calculated_price.calculated_amount",
                ],
            })
        }
    }

    async indexData(data: Record<string, unknown>[], type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        // Ensure settings are up to date
        await this.updateSettings(type)

        // Transform data to include id as primary key for Meilisearch
        const documents = data.map((item) => ({
            ...item,
            id: item.id,
        }))

        await index.addDocuments(documents, { primaryKey: "id" })
    }

    async retrieveFromIndex(documentIds: string[], type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        const results = await Promise.all(
            documentIds.map(async (id) => {
                try {
                    return await index.getDocument(id)
                } catch (error) {
                    // Document not found, return null
                    return null
                }
            })
        )

        return results.filter(Boolean)
    }

    async deleteFromIndex(documentIds: string[], type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        await index.deleteDocuments(documentIds)
    }

    async deleteAllDocuments(type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        await index.deleteAllDocuments()
    }

    async search(query: string, type: MeilisearchIndexType = "product") {
        const indexName = await this.getIndexName(type)
        const index = this.client.index(indexName)

        return await index.search(query)
    }
}

import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import StrapiModuleService, { Collection } from "../modules/strapi/service"

export default async function collectionSync({
    event,
    container,
}: SubscriberArgs<{ id: string }>) {
    const strapiService = container.resolve("strapi") as StrapiModuleService
    const query = container.resolve("query")
    const logger = container.resolve("logger")

    if (event.name === "product-collection.deleted") {
        try {
            const existing = await strapiService.findByMedusaId(Collection.COLLECTIONS, event.data.id)
            if (existing) {
                await strapiService.delete(Collection.COLLECTIONS, existing.documentId, { locale: '*' })
                logger.info(`Deleted collection ${event.data.id} from Strapi`)
            }
        } catch (error) {
            logger.error(`Error deleting collection from Strapi: ${error}`)
        }
        return
    }

    // Fetch the collection using Graph Query
    const { data: [collection] } = await query.graph({
        entity: "product_collection",
        fields: [
            "id",
            "title",
            "handle"
        ],
        filters: {
            id: event.data.id,
        },
    })

    if (!collection) {
        logger.warn(`Collection ${event.data.id} not found during sync`)
        return
    }

    try {
        const existing = await strapiService.findByMedusaId(Collection.COLLECTIONS, collection.id)

        const strapiData = {
            medusaId: collection.id,
            title: collection.title,
            medusaHandle: collection.handle,
        }

        let documentId: string
        let baseLocale: string | undefined

        if (existing) {
            const updated = await strapiService.update(Collection.COLLECTIONS, existing.documentId, strapiData)
            documentId = updated.data?.documentId
            baseLocale = updated.data?.locale
            logger.info(`Updated collection ${collection.id} in Strapi`)
        } else {
            try {
                const created = await strapiService.create(Collection.COLLECTIONS, strapiData)
                documentId = created.data?.documentId
                baseLocale = created.data?.locale
                logger.info(`Created collection ${collection.id} in Strapi`)
            } catch (createError) {
                const retryExisting = await strapiService.findByMedusaId(Collection.COLLECTIONS, collection.id)
                if (retryExisting) {
                    const updated = await strapiService.update(Collection.COLLECTIONS, retryExisting.documentId, strapiData)
                    documentId = updated.data?.documentId
                    baseLocale = updated.data?.locale
                    logger.info(`Updated collection ${collection.id} in Strapi (after create conflict)`)
                } else {
                    throw createError
                }
            }
        }

        if (documentId) {
            try {
                const locales = await strapiService.getLocales()
                for (const locale of locales) {
                    if (locale.code && locale.code !== baseLocale) {
                        await strapiService.update(Collection.COLLECTIONS, documentId, strapiData, { locale: locale.code })
                    }
                }
            } catch (localeError) {
                logger.warn(`Failed to sync collection localizations for ${collection.id}: ${localeError}`)
            }
        }
    } catch (error) {
        logger.error(`Error syncing collection to Strapi: ${error}`)
    }
}

export const config: SubscriberConfig = {
    event: ["product-collection.created", "product-collection.updated", "product-collection.deleted"],
}

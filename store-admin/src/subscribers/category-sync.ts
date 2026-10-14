import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import StrapiModuleService, { Collection } from "../modules/strapi/service"

export default async function categorySync({
    event,
    container,
}: SubscriberArgs<{ id: string }>) {
    const strapiService = container.resolve("strapi") as StrapiModuleService
    const query = container.resolve("query")
    const logger = container.resolve("logger")

    if (event.name === "product-category.deleted") {
        try {
            const existing = await strapiService.findByMedusaId(Collection.CATEGORIES, event.data.id)
            if (existing) {
                await strapiService.delete(Collection.CATEGORIES, existing.documentId, { locale: '*' })
                logger.info(`Deleted category ${event.data.id} from Strapi`)
            }
        } catch (error) {
            logger.error(`Error deleting category from Strapi: ${error}`)
        }
        return
    }

    // Fetch the category using Graph Query
    const { data: [category] } = await query.graph({
        entity: "product_category",
        fields: [
            "id",
            "name",
            "handle",
            "description"
        ],
        filters: {
            id: event.data.id,
        },
    })

    if (!category) {
        logger.warn(`Category ${event.data.id} not found during sync`)
        return
    }

    try {
        const existing = await strapiService.findByMedusaId(Collection.CATEGORIES, category.id)

        const strapiData = {
            medusaId: category.id,
            name: category.name,
            medusaHandle: category.handle,
            description: category.description ?? "",
        }

        let documentId: string
        let baseLocale: string | undefined

        if (existing) {
            const updated = await strapiService.update(Collection.CATEGORIES, existing.documentId, strapiData)
            documentId = updated.data?.documentId
            baseLocale = updated.data?.locale
            logger.info(`Updated category ${category.id} in Strapi`)
        } else {
            try {
                const created = await strapiService.create(Collection.CATEGORIES, strapiData)
                documentId = created.data?.documentId
                baseLocale = created.data?.locale
                logger.info(`Created category ${category.id} in Strapi`)
            } catch (createError) {
                const retryExisting = await strapiService.findByMedusaId(Collection.CATEGORIES, category.id)
                if (retryExisting) {
                    const updated = await strapiService.update(Collection.CATEGORIES, retryExisting.documentId, strapiData)
                    documentId = updated.data?.documentId
                    baseLocale = updated.data?.locale
                    logger.info(`Updated category ${category.id} in Strapi (after create conflict)`)
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
                        await strapiService.update(Collection.CATEGORIES, documentId, strapiData, { locale: locale.code })
                    }
                }
            } catch (localeError) {
                logger.warn(`Failed to sync category localizations for ${category.id}: ${localeError}`)
            }
        }
    } catch (error) {
        logger.error(`Error syncing category to Strapi: ${error}`)
    }
}

export const config: SubscriberConfig = {
    event: ["product-category.created", "product-category.updated", "product-category.deleted"],
}

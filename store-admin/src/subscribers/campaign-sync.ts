import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import StrapiModuleService, { Collection } from "../modules/strapi/service"
import {
    createCampaignsWorkflow,
    updateCampaignsWorkflow,
    deleteCampaignsWorkflow,
    createPromotionsWorkflow,
    updatePromotionsWorkflow,
} from "@medusajs/core-flows"

// Hook into standalone campaign creation
createCampaignsWorkflow.hooks.campaignsCreated(
    async ({ campaigns }, { container }) => {
        for (const campaign of campaigns) {
            await campaignSync({
                event: { name: "campaign.created", data: { id: campaign.id } },
                container
            } as any)
        }
    }
)

// Hook into standalone campaign updates
updateCampaignsWorkflow.hooks.campaignsUpdated(
    async ({ campaigns }, { container }) => {
        for (const campaign of campaigns) {
            await campaignSync({
                event: { name: "campaign.updated", data: { id: campaign.id } },
                container
            } as any)
        }
    }
)

// Hook into standalone campaign deletions
deleteCampaignsWorkflow.hooks.campaignsDeleted(
    async ({ ids }, { container }) => {
        const idArray = Array.isArray(ids) ? ids : (ids as any).ids || []
        for (const id of idArray) {
            await campaignSync({
                event: { name: "campaign.deleted", data: { id } },
                container
            } as any)
        }
    }
)

// Hook into promotion creation (handles inline campaigns created via promotion wizard)
createPromotionsWorkflow.hooks.promotionsCreated(
    async ({ promotions }, { container }) => {
        const query = container.resolve("query")
        for (const promotion of promotions) {
            try {
                let campaignId = (promotion as any).campaign_id || (promotion as any).campaign?.id
                if (!campaignId) {
                    const { data: [prom] } = await query.graph({
                        entity: "promotion",
                        fields: ["id", "campaign.id"],
                        filters: { id: promotion.id },
                    })
                    campaignId = prom?.campaign?.id
                }
                if (campaignId) {
                    await campaignSync({
                        event: { name: "campaign.created", data: { id: campaignId } },
                        container
                    } as any)
                }
            } catch (error) {
                const logger = container.resolve("logger")
                logger.error(`Error syncing campaign from promotion creation: ${error}`)
            }
        }
    }
)

// Hook into promotion update (handles inline campaigns assigned or updated via promotion)
updatePromotionsWorkflow.hooks.promotionsUpdated(
    async ({ promotions }, { container }) => {
        const query = container.resolve("query")
        for (const promotion of promotions) {
            try {
                let campaignId = (promotion as any).campaign_id || (promotion as any).campaign?.id
                if (!campaignId) {
                    const { data: [prom] } = await query.graph({
                        entity: "promotion",
                        fields: ["id", "campaign.id"],
                        filters: { id: promotion.id },
                    })
                    campaignId = prom?.campaign?.id
                }
                if (campaignId) {
                    await campaignSync({
                        event: { name: "campaign.updated", data: { id: campaignId } },
                        container
                    } as any)
                }
            } catch (error) {
                const logger = container.resolve("logger")
                logger.error(`Error syncing campaign from promotion update: ${error}`)
            }
        }
    }
)

export default async function campaignSync({
    event,
    container,
}: SubscriberArgs<{ id: string }>) {
    const strapiService = container.resolve("strapi") as StrapiModuleService
    const query = container.resolve("query")
    const logger = container.resolve("logger")

    if (event.name === "campaign.deleted") {
        try {
            const existing = await strapiService.findByMedusaId(Collection.CAMPAIGNS, event.data.id)
            if (existing) {
                await strapiService.delete(Collection.CAMPAIGNS, existing.documentId, { locale: '*' })
                logger.info(`Deleted campaign ${event.data.id} from Strapi`)
            }
        } catch (error) {
            logger.error(`Error deleting campaign from Strapi: ${error}`)
        }
        return
    }

    // Fetch the campaign using Graph Query
    const { data: [campaign] } = await query.graph({
        entity: "campaign",
        fields: [
            "id",
            "name",
            "campaign_identifier",
            "starts_at",
            "ends_at"
        ],
        filters: {
            id: event.data.id,
        },
    })

    if (!campaign) {
        logger.warn(`Campaign ${event.data.id} not found during sync`)
        return
    }

    try {
        const existing = await strapiService.findByMedusaId(Collection.CAMPAIGNS, campaign.id)

        const strapiData = {
            medusaId: campaign.id,
            name: campaign.name,
            campaignIdentifier: campaign.campaign_identifier,
            startsAt: campaign.starts_at,
            endsAt: campaign.ends_at,
        }

        let documentId: string
        let baseLocale: string | undefined

        if (existing) {
            const updated = await strapiService.update(Collection.CAMPAIGNS, existing.documentId, strapiData)
            documentId = updated.data?.documentId
            baseLocale = updated.data?.locale
            logger.info(`Updated campaign ${campaign.id} in Strapi`)
        } else {
            const created = await strapiService.create(Collection.CAMPAIGNS, strapiData)
            documentId = created.data?.documentId
            baseLocale = created.data?.locale
            logger.info(`Created campaign ${campaign.id} in Strapi`)
        }

        if (documentId) {
            try {
                const locales = await strapiService.getLocales()
                for (const locale of locales) {
                    if (locale.code && locale.code !== baseLocale) {
                        await strapiService.update(Collection.CAMPAIGNS, documentId, strapiData, { locale: locale.code })
                    }
                }
            } catch (localeError) {
                logger.warn(`Failed to sync campaign localizations for ${campaign.id}: ${localeError}`)
            }
        }
    } catch (error) {
        logger.error(`Error syncing campaign to Strapi: ${error}`)
    }
}

export const config: SubscriberConfig = {
    event: ["campaign.created", "campaign.updated", "campaign.deleted"],
}

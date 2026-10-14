import { type SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import StrapiModuleService, { Collection } from "../modules/strapi/service"

// In-memory lock to prevent race conditions when multiple events (e.g. campaign.created & promotion.created)
// fire simultaneously for the same campaign.
const inProgressCampaignSyncs = new Map<string, Promise<void>>()

export default async function campaignSync({
    event,
    container,
}: SubscriberArgs<{ id: string }>) {
    const strapiService = container.resolve("strapi") as StrapiModuleService
    const query = container.resolve("query")
    const logger = container.resolve("logger")

    let campaignId: string | undefined = event.data.id

    // If triggered by a promotion event, resolve the associated campaign ID
    if (event.name.startsWith("promotion.")) {
        try {
            const { data: [prom] } = await query.graph({
                entity: "promotion",
                fields: ["id", "campaign.id"],
                filters: { id: event.data.id },
            })
            campaignId = prom?.campaign?.id
        } catch (error: any) {
            logger.warn(`Could not resolve campaign for promotion ${event.data.id}: ${error.message}`)
            return
        }
    }

    if (!campaignId) {
        return
    }

    if (event.name === "campaign.deleted") {
        try {
            const existing = await strapiService.findByMedusaId(Collection.CAMPAIGNS, campaignId)
            if (existing) {
                await strapiService.delete(Collection.CAMPAIGNS, existing.documentId, { locale: '*' })
                logger.info(`Deleted campaign ${campaignId} from Strapi`)
            }
        } catch (error) {
            logger.error(`Error deleting campaign from Strapi: ${error}`)
        }
        return
    }

    // Wait for any existing sync for this campaign ID to complete
    while (inProgressCampaignSyncs.has(campaignId)) {
        await inProgressCampaignSyncs.get(campaignId)
    }

    let releaseLock!: () => void
    const lockPromise = new Promise<void>((resolve) => {
        releaseLock = resolve
    })
    inProgressCampaignSyncs.set(campaignId, lockPromise)

    try {
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
                id: campaignId,
            },
        })

        if (!campaign) {
            logger.warn(`Campaign ${campaignId} not found during sync`)
            return
        }

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
            try {
                const created = await strapiService.create(Collection.CAMPAIGNS, strapiData)
                documentId = created.data?.documentId
                baseLocale = created.data?.locale
                logger.info(`Created campaign ${campaign.id} in Strapi`)
            } catch (createError) {
                // If it failed because it was already created concurrently, update the newly created record
                const retryExisting = await strapiService.findByMedusaId(Collection.CAMPAIGNS, campaign.id)
                if (retryExisting) {
                    const updated = await strapiService.update(Collection.CAMPAIGNS, retryExisting.documentId, strapiData)
                    documentId = updated.data?.documentId
                    baseLocale = updated.data?.locale
                    logger.info(`Updated campaign ${campaign.id} in Strapi (after create conflict)`)
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
                        await strapiService.update(Collection.CAMPAIGNS, documentId, strapiData, { locale: locale.code })
                    }
                }
            } catch (localeError) {
                logger.warn(`Failed to sync campaign localizations for ${campaign.id}: ${localeError}`)
            }
        }
    } catch (error) {
        logger.error(`Error syncing campaign to Strapi: ${error}`)
    } finally {
        inProgressCampaignSyncs.delete(campaignId)
        releaseLock()
    }
}

export const config: SubscriberConfig = {
    event: [
        "campaign.created",
        "campaign.updated",
        "campaign.deleted",
        "promotion.created",
        "promotion.updated",
    ],
}

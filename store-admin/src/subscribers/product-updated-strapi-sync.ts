import {
  type SubscriberConfig,
  type SubscriberArgs,
} from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { updateProductInStrapiWorkflow } from "../workflows/update-product-in-strapi"

export default async function productUpdatedStrapiSyncHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cachingService = container.resolve(Modules.CACHE)
  const logger = container.resolve("logger")
  const query = container.resolve("query")

  logger.info(`productUpdatedStrapiSyncHandler triggered for product: ${data.id}`)

  // Check if this update is being processed from a Strapi webhook
  // If so, skip syncing back to prevent infinite loops
  const cacheKey = `strapi-update:product:${data.id}`
  const isProcessingFromStrapi = await cachingService.get(cacheKey)

  if (isProcessingFromStrapi) {
    logger.info(`Product ${data.id} update originated from Strapi, skipping sync to prevent infinite loop`)
    return
  }

  try {
    logger.info(`Syncing product ${data.id} to Strapi...`)
    await updateProductInStrapiWorkflow(container).run({
      input: {
        id: data.id,
      },
    })
    logger.info(`Successfully synced product ${data.id} to Strapi`)
  } catch (err: any) {
    logger.error(`Failed to sync product ${data.id} to Strapi: ${err.message || err}`)
    if (err.stack) {
      logger.error(err.stack)
    }
  }
}

export const config: SubscriberConfig = {
  event: "product.updated",
}

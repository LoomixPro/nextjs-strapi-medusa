import {
    SubscriberArgs,
    type SubscriberConfig,
} from "@medusajs/framework"
import { IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/utils"
import { syncProductsWorkflow } from "../workflows/sync-products"

export default async function handleProductEvents({
    event: { data, name },
    container,
}: SubscriberArgs<{ id: string; product_id?: string }>) {
    const logger = container.resolve("logger")
    let productId: string | undefined

    try {
        if (name.startsWith("product-variant.")) {
            // Variant events: look up the parent product
            const productService: IProductModuleService = container.resolve(Modules.PRODUCT)
            const variant = await productService.retrieveProductVariant(data.id, {
                relations: ["product"],
            })
            productId = variant?.product_id ?? undefined
        } else if (name.startsWith("product-option.")) {
            // Option events: look up the parent product
            const productService: IProductModuleService = container.resolve(Modules.PRODUCT)
            const option = await productService.retrieveProductOption(data.id, {
                relations: ["product"],
            })
            productId = (option as any)?.product_id
        } else {
            // Product events: use the ID directly
            productId = data.id
        }
    } catch (error: any) {
        logger.error(`[product-sync] Failed to resolve product ID for ${name}: ${error.message}`)
        return
    }

    if (!productId) {
        logger.warn(`[product-sync] No product ID resolved for event ${name} with data.id=${data.id}`)
        return
    }

    logger.info(`[product-sync] Syncing product ${productId} triggered by ${name}`)

    await syncProductsWorkflow(container)
        .run({
            input: {
                filters: {
                    id: productId,
                },
            },
        })
}

export const config: SubscriberConfig = {
    event: [
        "product.created", "product.updated",
        "product-variant.created", "product-variant.updated", "product-variant.deleted",
        "product-option.created", "product-option.updated", "product-option.deleted"
    ],
}

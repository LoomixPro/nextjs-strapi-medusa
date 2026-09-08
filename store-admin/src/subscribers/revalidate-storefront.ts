import {
    type SubscriberConfig,
    type SubscriberArgs,
} from "@medusajs/framework"
import { IProductModuleService } from "@medusajs/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

/**
 * Revalidation Subscriber (Surgical + Multi-Region + Trace Logging)
 */
export default async function revalidateStorefrontHandler({
    event,
    container,
}: SubscriberArgs<any>) {
    const logger = container.resolve("logger")

    const STOREFRONT_URL = process.env.STOREFRONT_URL || process.env.STOREFRONT_INTERNAL_URL || "http://storefront:8000"
    const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET
    const DEFAULT_COUNTRY_CODE = (
        process.env.DEFAULT_REGION ||
        process.env.DEFAULT_COUNTRY_CODE ||
        "us"
    ).toLowerCase()

    if (!REVALIDATE_SECRET) {
        return
    }

    const pathsToRevalidate: string[] = []
    const tagsToRevalidate: string[] = []

    // Helper to get all active country codes from Medusa regions
    const getActiveCountryCodes = async (): Promise<string[]> => {
        try {
            const query = container.resolve(ContainerRegistrationKeys.QUERY)
            const { data: regions } = await query.graph({
                entity: "region",
                fields: ["countries.iso_2"],
            })
            const codes = new Set<string>()
            for (const r of regions || []) {
                for (const c of (r as any).countries || []) {
                    if (c.iso_2) codes.add(c.iso_2.toLowerCase())
                }
            }
            if (codes.size > 0) return [...codes]
        } catch (e: any) {
            logger.warn(`Could not fetch regions for revalidation: ${e.message}`)
        }
        return [DEFAULT_COUNTRY_CODE]
    }

    // Helper to add product and its categories paths for all active country codes
    const addProductPaths = async (productId: string) => {
        try {
            const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
            const product = await productModuleService.retrieveProduct(productId, {
                relations: ["categories"]
            })

            if (product) {
                const countryCodes = await getActiveCountryCodes()

                for (const code of countryCodes) {
                    // Product detail page
                    pathsToRevalidate.push(`/${code}/products/${product.handle}`)

                    // Store listing page (always revalidate on product change)
                    pathsToRevalidate.push(`/${code}/store`)

                    // Category pages
                    if (product.categories && product.categories.length > 0) {
                        product.categories.forEach(cat => {
                            pathsToRevalidate.push(`/${code}/categories/${cat.handle}`)
                        })
                    }
                }
            }
        } catch (error: any) {
            logger.error(`Failed to fetch product for revalidation: ${error.message}`)
        }
    }

    // Surgical Path Logic
    if (event.name.startsWith("product.")) {
        const productId = event.data.id || (Array.isArray(event.data) ? event.data[0].id : null)
        if (productId) {
            await addProductPaths(productId)
            tagsToRevalidate.push("store-products")
        }
    } else if (event.name.startsWith("product-variant.")) {
        // When a variant is updated (e.g., metadata changes), revalidate the product page
        try {
            const productModuleService: IProductModuleService = container.resolve(Modules.PRODUCT)
            const variant = await productModuleService.retrieveProductVariant(event.data.id, {
                relations: ["product", "product.categories"]
            })

            if (variant?.product_id) {
                await addProductPaths(variant.product_id)
            }
            tagsToRevalidate.push("store-products")
            tagsToRevalidate.push("variants")
        } catch (error) {
            logger.error(`Failed to fetch variant for revalidation: ${error.message}`)
        }
    } else if (event.name.startsWith("product-option.")) {
        // When a product option changes (e.g. Color name changes), revalidate the product and global store-products
        const productId = event.data?.product_id
        if (productId) {
            await addProductPaths(productId)
        }
        tagsToRevalidate.push("store-products")
        tagsToRevalidate.push("variants")
    } else if (event.name.startsWith("product-category.")) {
        // For category metadata updates (name, description, etc.), use tag-based revalidation
        // This revalidates the category list but not individual category product pages
        try {
            const revalidateUrl = `${STOREFRONT_URL}/api/revalidate`
            logger.info(`Revalidation (Tag): categories`)

            const response = await fetch(revalidateUrl, {
                method: "POST",
                body: JSON.stringify({ tags: ["categories"] }),
                headers: { 
                    "Content-Type": "application/json",
                    "x-strapi-secret": REVALIDATE_SECRET
                }
            })

            if (!response.ok) {
                const err = await response.text()
                logger.error(`Revalidation failed: ${response.status} - ${err}`)
            } else {
                logger.info("Revalidation Success")
            }
        } catch (error) {
            logger.error(`Revalidation Error: ${error.message}`)
        }
        return // Early return since we handled this differently
    } else if (event.name.startsWith("product-collection.")) {
        const countryCodes = await getActiveCountryCodes()
        for (const code of countryCodes) {
            pathsToRevalidate.push(`/${code}/store`)
        }
        const productId = event.data.product_id || event.data.id
        if (productId && typeof productId === "string") {
            await addProductPaths(productId)
        }
        tagsToRevalidate.push("store-products")
    }

    if (pathsToRevalidate.length === 0 && tagsToRevalidate.length === 0) return

    try {
        const revalidateUrl = `${STOREFRONT_URL}/api/revalidate`
        const uniquePaths = [...new Set(pathsToRevalidate)]
        const uniqueTags = [...new Set(tagsToRevalidate)]
        logger.info(`Revalidation Execution: Paths: ${uniquePaths.join(", ")}, Tags: ${uniqueTags.join(", ")}`)

        const response = await fetch(revalidateUrl, {
            method: "POST",
            body: JSON.stringify({ 
                paths: uniquePaths,
                tags: uniqueTags
            }),
            headers: { 
                "Content-Type": "application/json",
                "x-strapi-secret": REVALIDATE_SECRET
            }
        })

        if (!response.ok) {
            const err = await response.text()
            logger.error(`Revalidation failed: ${response.status} - ${err}`)
        } else {
            logger.info("Revalidation Success")
        }
    } catch (error) {
        logger.error(`Revalidation Error: ${error.message}`)
    }
}

export const config: SubscriberConfig = {
    event: [
        "product.created", "product.updated", "product.deleted",
        "product-variant.created", "product-variant.updated", "product-variant.deleted",
        "product-category.created", "product-category.updated", "product-category.deleted",
        "product-collection.created", "product-collection.updated", "product-collection.deleted",
        "product-option.created", "product-option.updated", "product-option.deleted",
    ],
}

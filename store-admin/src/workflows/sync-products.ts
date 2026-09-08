import {
    createWorkflow,
    transform,
    WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { syncProductsStep, SyncProductsStepInput } from "./steps/sync-products"
import { deleteProductsFromMeilisearchStep } from "./steps/delete-products-from-meilisearch"

type SyncProductsWorkflowInput = {
    filters?: Record<string, unknown>
    limit?: number
    offset?: number
}

export const syncProductsWorkflow = createWorkflow(
    "sync-products",
    ({ filters, limit, offset }: SyncProductsWorkflowInput) => {
        const { data: products, metadata } = useQueryGraphStep({
            entity: "product",
            fields: [
                "id",
                "title",
                "description",
                "handle",
                "thumbnail",
                "categories.id",
                "categories.name",
                "categories.handle",
                "tags.id",
                "tags.value",
                "collection_id",
                "variants.id",
                "variants.title",
                "variants.thumbnail",
                "variants.images.*",
                "variants.metadata",
                "variants.calculated_price",
                "variants.inventory_items.inventory.location_levels.stocked_quantity",
                "variants.manage_inventory",
                "variants.allow_backorder",
                "variants.price_set.prices.*",
                "variants.options.title",
                "variants.options.value",
                "variants.options.option.title",
                "options.title",
                "options.values.value",
                "status",
            ],
            pagination: {
                take: limit,
                skip: offset,
            },
            filters,
        })

        const {
            publishedProducts,
            unpublishedProductsToDelete,
        } = transform({
            products,
        }, (data) => {
            const publishedProducts: SyncProductsStepInput["products"] = []
            const unpublishedProductsToDelete: string[] = []

            data.products.forEach((product) => {
                if (product.status === "published") {
                    const { status, options, ...rest } = product

                    const mappedOptions = options?.flatMap((opt: any) =>
                        (opt.values || []).map((val: any) => ({
                            title: opt.title,
                            value: val.value
                        }))
                    )

                    const mappedVariants = rest.variants?.map((variant: any) => {
                        const priceSet = variant.price_set
                        const price = priceSet?.prices?.[0]

                        // Calculate true inventory from location levels in Medusa v2
                        let totalStock = 0
                        if (variant.inventory_items) {
                            variant.inventory_items.forEach((item: any) => {
                                if (item.inventory?.location_levels) {
                                    item.inventory.location_levels.forEach((level: any) => {
                                        totalStock += (level.stocked_quantity || 0)
                                    })
                                }
                            })
                        }

                        // For basic availability filtering in Meilisearch, we synthesize an understandable quantity.
                        // If it doesn't manage inventory or allows backorders, we act as if it has stock (e.g., 100).
                        const hasStock = variant.manage_inventory === false || variant.allow_backorder || totalStock > 0
                        const synthesizedQuantity = hasStock ? Math.max(1, totalStock || 1) : 0

                        return {
                            ...variant,
                            inventory_quantity: synthesizedQuantity,
                            calculated_price: price ? {
                                calculated_amount: price.amount,
                                original_amount: price.amount, // Assuming no discounts for now
                                currency_code: price.currency_code,
                                calculated_price: {
                                    price_list_type: "default"
                                }
                            } : null,
                        }
                    })

                    // Custom Fields for Faceting
                    const isColorOption = (title?: string) => {
                        if (!title) return false
                        const t = title.trim().toLowerCase()
                        return t === "color" || t === "colors"
                    }

                    const colorFacets = rest.variants?.map((v: any) => {
                        const colorOpt = v.options?.find((o: any) => 
                            isColorOption(o.title) || isColorOption(o.option?.title)
                        )
                        if (!colorOpt?.value) return null
                        const colorValue = colorOpt.value
                        const metadata = v.metadata || v.user_metadata || {}
                        const hex = metadata.color_code || colorValue
                        // Format: "Name::#Hex"
                        return `${colorValue}::${hex}`
                    }).filter(Boolean)

                    const uniqueColorFacets = [...new Set(colorFacets)]

                    publishedProducts.push({
                        ...rest,
                        options: mappedOptions,
                        variants: mappedVariants,
                        color_facets: uniqueColorFacets.length > 0 ? uniqueColorFacets : undefined
                    } as unknown as SyncProductsStepInput["products"][0])
                } else {
                    unpublishedProductsToDelete.push(product.id)
                }
            })

            return {
                publishedProducts,
                unpublishedProductsToDelete,
            }
        })

        syncProductsStep({
            products: publishedProducts,
        })

        deleteProductsFromMeilisearchStep({
            ids: unpublishedProductsToDelete,
        })

        return new WorkflowResponse({
            products,
            metadata,
        })
    }
)

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

            const defaultRegion = (
                process.env.DEFAULT_REGION ||
                process.env.DEFAULT_COUNTRY_CODE ||
                "us"
            ).toLowerCase()

            const regionToCurrency: Record<string, string> = {
                us: "usd",
                ir: "irr",
                ae: "aed",
                eu: "eur",
                gb: "gbp",
                de: "eur",
                fr: "eur",
            }

            const defaultCurrency = (
                process.env.DEFAULT_CURRENCY ||
                regionToCurrency[defaultRegion] ||
                "usd"
            ).toLowerCase()

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
                        const prices: any[] = priceSet?.prices || []

                        // Find price matching default store currency, fallback to first price
                        const targetPrice = prices.find(
                            (p: any) => p.currency_code?.toLowerCase() === defaultCurrency && !p.price_list_id
                        ) || prices.find(
                            (p: any) => p.currency_code?.toLowerCase() === defaultCurrency
                        ) || prices[0]

                        const hasSalePrice = prices.some((p: any) => Boolean(p.price_list_id))

                        // Build structured map of prices by currency
                        const pricesByCurrency: Record<string, { amount: number; currency_code: string }> = {}
                        for (const p of prices) {
                            if (p.currency_code && p.amount !== undefined && p.amount !== null) {
                                pricesByCurrency[p.currency_code.toLowerCase()] = {
                                    amount: p.amount,
                                    currency_code: p.currency_code.toLowerCase(),
                                }
                            }
                        }

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
                            calculated_price: targetPrice ? {
                                calculated_amount: targetPrice.amount,
                                original_amount: targetPrice.amount,
                                currency_code: targetPrice.currency_code?.toLowerCase(),
                                calculated_price: {
                                    price_list_type: hasSalePrice ? "sale" : "default"
                                }
                            } : null,
                            prices_by_currency: pricesByCurrency,
                            on_sale: hasSalePrice,
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

                    // Aggregate minimum price per currency across variants for product-level filtering
                    const productPricesByCurrency: Record<string, number> = {}
                    for (const v of mappedVariants || []) {
                        if (v.prices_by_currency) {
                            for (const [curr, p] of Object.entries(v.prices_by_currency as Record<string, { amount: number }>)) {
                                if (productPricesByCurrency[curr] === undefined || p.amount < productPricesByCurrency[curr]) {
                                    productPricesByCurrency[curr] = p.amount
                                }
                            }
                        }
                    }

                    const productOnSale = (mappedVariants || []).some((v: any) => Boolean(v.on_sale))

                    publishedProducts.push({
                        ...rest,
                        options: mappedOptions,
                        variants: mappedVariants,
                        prices_by_currency: productPricesByCurrency,
                        on_sale: productOnSale,
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
